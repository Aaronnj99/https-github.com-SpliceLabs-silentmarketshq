import { NextResponse } from 'next/server'
import { getUpcomingEvents, isCalendarConnected } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

export async function GET() {
  const connected = await isCalendarConnected()

  if (!connected) {
    return NextResponse.json({
      connected: false,
      events: [],
      message: 'Google Calendar not connected. Visit /api/calendar/auth to connect.',
    })
  }

  try {
    const events = await getUpcomingEvents(7, 20)
    return NextResponse.json({ connected: true, events })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch events'
    console.error('Calendar events error:', error)
    return NextResponse.json(
      { connected: true, events: [], error: message },
      { status: 500 }
    )
  }
}
