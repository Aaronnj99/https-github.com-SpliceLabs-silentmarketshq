import { isPast, isToday, parseISO, format } from 'date-fns'
import { getReminders } from './db'
import { getUpcomingEvents, isCalendarConnected } from './google-calendar'
import { sendTelegramMessage, escapeHtml } from './telegram'

export async function buildDailyDigest(): Promise<string> {
  const lines: string[] = []
  lines.push(`📋 <b>Daily Briefing — ${format(new Date(), 'EEEE, MMM d')}</b>`)

  // Today's calendar events
  if (isCalendarConnected()) {
    try {
      const events = await getUpcomingEvents(1, 20)
      const todayEvents = events.filter((e) => {
        const start = e.start.includes('T') ? parseISO(e.start) : new Date(`${e.start}T00:00:00`)
        return isToday(start)
      })

      if (todayEvents.length > 0) {
        lines.push('\n🗓 <b>Today\'s Events</b>')
        for (const event of todayEvents) {
          const time = event.start.includes('T') ? format(parseISO(event.start), 'HH:mm') : 'All day'
          lines.push(`  ${time} — ${escapeHtml(event.summary)}`)
        }
      } else {
        lines.push('\n🗓 No events scheduled today')
      }
    } catch (error) {
      console.error('Daily digest: failed to fetch calendar events', error)
    }
  }

  // Reminders
  const reminders = getReminders(false)

  const overdue = reminders.filter(
    (r) => r.due_at && isPast(parseISO(r.due_at)) && !isToday(parseISO(r.due_at))
  )
  const dueToday = reminders.filter((r) => r.due_at && isToday(parseISO(r.due_at)))
  const focus = reminders.filter((r) => !r.due_at && r.priority === 'high')

  if (overdue.length > 0) {
    lines.push('\n⚠️ <b>Overdue</b>')
    for (const r of overdue) lines.push(`  • ${escapeHtml(r.title)}`)
  }

  if (dueToday.length > 0) {
    lines.push('\n✅ <b>Due Today</b>')
    for (const r of dueToday) lines.push(`  • ${escapeHtml(r.title)}`)
  }

  if (focus.length > 0) {
    lines.push('\n🔥 <b>High Priority</b>')
    for (const r of focus) lines.push(`  • ${escapeHtml(r.title)}`)
  }

  if (overdue.length === 0 && dueToday.length === 0 && focus.length === 0) {
    lines.push('\n✨ No pending tasks — clear day ahead')
  }

  return lines.join('\n')
}

export async function sendDailyDigest(): Promise<void> {
  const message = await buildDailyDigest()
  await sendTelegramMessage(message)
}
