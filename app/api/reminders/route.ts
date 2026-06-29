import { NextRequest, NextResponse } from 'next/server'
import { getReminders, createReminder, updateReminder, deleteReminder } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeCompleted = searchParams.get('completed') === '1'
    const reminders = await getReminders(includeCompleted)
    return NextResponse.json(reminders)
  } catch (error) {
    console.error('Reminders GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      title?: string
      description?: string
      due_at?: string
      priority?: 'low' | 'normal' | 'high'
    }

    const { title, description, due_at, priority } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    if (priority && !['low', 'normal', 'high'].includes(priority)) {
      return NextResponse.json({ error: 'priority must be low, normal, or high' }, { status: 400 })
    }

    const reminder = await createReminder(
      title.trim(),
      description,
      due_at,
      priority ?? 'normal'
    )
    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    console.error('Reminders POST error:', error)
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') ?? '', 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid or missing id' }, { status: 400 })
    }

    const body = await request.json() as Record<string, unknown>
    const updated = await updateReminder(id, body)
    if (!updated) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Reminders PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') ?? '', 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid or missing id' }, { status: 400 })
    }

    await deleteReminder(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reminders DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 })
  }
}
