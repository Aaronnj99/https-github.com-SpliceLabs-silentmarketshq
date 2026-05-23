import fs from 'fs'
import path from 'path'

export interface ObsidianNote {
  filename: string
  title: string
  path: string
  content: string
  preview: string
  modified: Date
  created: Date
  tags: string[]
  wordCount: number
}

function getVaultPath(): string {
  return process.env.OBSIDIAN_VAULT_PATH ?? ''
}

function isVaultConfigured(): boolean {
  const vaultPath = getVaultPath()
  if (!vaultPath) return false
  try {
    return fs.existsSync(vaultPath) && fs.statSync(vaultPath).isDirectory()
  } catch {
    return false
  }
}

function extractTags(content: string): string[] {
  const tags: string[] = []

  // Extract frontmatter tags
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1]
    const tagsMatch = frontmatter.match(/^tags:\s*(.+)$/m)
    if (tagsMatch) {
      const tagsStr = tagsMatch[1].trim()
      if (tagsStr.startsWith('[')) {
        try {
          const parsed = JSON.parse(tagsStr) as string[]
          tags.push(...parsed)
        } catch {
          // ignore
        }
      } else {
        tags.push(...tagsStr.split(',').map((t) => t.trim()))
      }
    }

    // YAML list format
    const yamlListMatch = frontmatter.match(/^tags:\n((?:\s+-\s+.+\n?)+)/m)
    if (yamlListMatch) {
      const items = yamlListMatch[1].match(/^\s+-\s+(.+)$/gm)
      if (items) {
        tags.push(...items.map((i) => i.replace(/^\s+-\s+/, '').trim()))
      }
    }
  }

  // Extract inline tags
  const inlineTags = content.match(/#([a-zA-Z0-9_/-]+)/g)
  if (inlineTags) {
    tags.push(...inlineTags.map((t) => t.slice(1)))
  }

  return [...new Set(tags)]
}

function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim()
}

function extractTitle(content: string, filename: string): string {
  // Try frontmatter title
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (frontmatterMatch) {
    const titleMatch = frontmatterMatch[1].match(/^title:\s*(.+)$/m)
    if (titleMatch) return titleMatch[1].trim().replace(/^["']|["']$/g, '')
  }

  // Try first heading
  const stripped = stripFrontmatter(content)
  const headingMatch = stripped.match(/^#{1,3}\s+(.+)$/m)
  if (headingMatch) return headingMatch[1].trim()

  // Fall back to filename
  return filename.replace(/\.md$/, '').replace(/-/g, ' ')
}

function getPreview(content: string, length = 200): string {
  const stripped = stripFrontmatter(content)
    .replace(/^#{1,6}\s+.+$/gm, '') // Remove headings
    .replace(/\[\[([^\]]+)\]\]/g, '$1') // Unfold wikilinks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Unfold markdown links
    .replace(/[*_~`]/g, '') // Remove formatting
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim()

  if (stripped.length <= length) return stripped
  return stripped.slice(0, length) + '...'
}

export function getAllNotes(): ObsidianNote[] {
  const vaultPath = getVaultPath()
  if (!isVaultConfigured()) return []

  const notes: ObsidianNote[] = []

  function readDir(dirPath: string) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue
        const fullPath = path.join(dirPath, entry.name)
        if (entry.isDirectory()) {
          readDir(fullPath)
        } else if (entry.name.endsWith('.md')) {
          try {
            const stat = fs.statSync(fullPath)
            const content = fs.readFileSync(fullPath, 'utf-8')
            const words = content.split(/\s+/).filter(Boolean)

            notes.push({
              filename: entry.name,
              title: extractTitle(content, entry.name),
              path: fullPath,
              content,
              preview: getPreview(content),
              modified: stat.mtime,
              created: stat.birthtime,
              tags: extractTags(content),
              wordCount: words.length,
            })
          } catch {
            // Skip files that can't be read
          }
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }

  readDir(vaultPath)
  return notes.sort((a, b) => b.modified.getTime() - a.modified.getTime())
}

export function getRecentNotes(limit = 10): ObsidianNote[] {
  return getAllNotes().slice(0, limit)
}

export function searchNotes(query: string): ObsidianNote[] {
  if (!query.trim()) return getRecentNotes(20)
  const notes = getAllNotes()
  const q = query.toLowerCase()

  const scored = notes.map((note) => {
    let score = 0
    if (note.title.toLowerCase().includes(q)) score += 10
    if (note.tags.some((t) => t.toLowerCase().includes(q))) score += 5
    if (note.content.toLowerCase().includes(q)) score += 1
    return { note, score }
  })

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.note)
    .slice(0, 20)
}

export function getNoteByPath(notePath: string): ObsidianNote | null {
  if (!isVaultConfigured()) return null
  const vaultPath = getVaultPath()

  // Security: ensure the path is within vault
  const resolvedPath = path.resolve(notePath)
  const resolvedVault = path.resolve(vaultPath)
  if (!resolvedPath.startsWith(resolvedVault)) return null

  try {
    const stat = fs.statSync(resolvedPath)
    const content = fs.readFileSync(resolvedPath, 'utf-8')
    const words = content.split(/\s+/).filter(Boolean)
    const filename = path.basename(resolvedPath)

    return {
      filename,
      title: extractTitle(content, filename),
      path: resolvedPath,
      content,
      preview: getPreview(content),
      modified: stat.mtime,
      created: stat.birthtime,
      tags: extractTags(content),
      wordCount: words.length,
    }
  } catch {
    return null
  }
}

export function isObsidianConfigured(): boolean {
  return isVaultConfigured()
}

export function createNote(title: string, content: string): ObsidianNote | null {
  const vaultPath = getVaultPath()
  if (!isVaultConfigured()) return null

  const sanitized = title.replace(/[^a-zA-Z0-9 _-]/g, '').trim()
  const filename = `${sanitized || 'Untitled'}.md`
  const filePath = path.join(vaultPath, filename)

  const fullContent = `# ${title}\n\n${content}`
  fs.writeFileSync(filePath, fullContent, 'utf-8')

  const stat = fs.statSync(filePath)
  const words = fullContent.split(/\s+/).filter(Boolean)

  return {
    filename,
    title,
    path: filePath,
    content: fullContent,
    preview: getPreview(fullContent),
    modified: stat.mtime,
    created: stat.birthtime,
    tags: extractTags(fullContent),
    wordCount: words.length,
  }
}
