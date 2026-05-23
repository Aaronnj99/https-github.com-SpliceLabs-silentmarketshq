import { NextRequest, NextResponse } from 'next/server'
import { getRecentNotes, createNote, isObsidianConfigured } from '@/lib/obsidian'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const configured = isObsidianConfigured()

    if (!configured) {
      return NextResponse.json({ configured: false, notes: [] })
    }

    const notes = getRecentNotes(limit)

    // Serialize dates
    const serialized = notes.map((note) => ({
      ...note,
      modified: note.modified.toISOString(),
      created: note.created.toISOString(),
      content: undefined, // Don't send full content in list
    }))

    return NextResponse.json({ configured: true, notes: serialized })
  } catch (error) {
    console.error('Obsidian notes GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const configured = isObsidianConfigured()
    if (!configured) {
      return NextResponse.json(
        { error: 'Obsidian vault not configured. Set OBSIDIAN_VAULT_PATH in .env.local' },
        { status: 503 }
      )
    }

    const body = await request.json() as { title?: string; content?: string }
    const { title, content } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const note = createNote(title.trim(), content ?? '')
    if (!note) {
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
    }

    return NextResponse.json({
      ...note,
      modified: note.modified.toISOString(),
      created: note.created.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Obsidian notes POST error:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}
