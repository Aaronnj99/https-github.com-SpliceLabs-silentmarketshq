import { NextRequest, NextResponse } from 'next/server'
import { searchNotes, isObsidianConfigured } from '@/lib/obsidian'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') ?? ''
    const configured = isObsidianConfigured()

    if (!configured) {
      return NextResponse.json({ configured: false, notes: [] })
    }

    const notes = searchNotes(query)

    // Serialize dates and strip full content
    const serialized = notes.map((note) => ({
      ...note,
      modified: note.modified.toISOString(),
      created: note.created.toISOString(),
      content: undefined,
    }))

    return NextResponse.json({ configured: true, notes: serialized, query })
  } catch (error) {
    console.error('Obsidian search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
