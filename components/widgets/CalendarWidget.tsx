'use client'
import { Calendar, Clock, MapPin, ExternalLink, Link2 } from 'lucide-react'
import { useCalendar } from '@/hooks/useCalendar'
import { format, isToday, isTomorrow, parseISO, differenceInMinutes } from 'date-fns'

function formatEventTime(start: string, end: string): string {
  // All-day event (date only, no time)
  if (!start.includes('T')) {
    return 'All day'
  }
  try {
    const startDate = parseISO(start)
    const endDate = parseISO(end)
    const startStr = format(startDate, 'HH:mm')
    const endStr = format(endDate, 'HH:mm')
    const duration = differenceInMinutes(endDate, startDate)
    const hours = Math.floor(duration / 60)
    const mins = duration % 60
    const durationStr = hours > 0
      ? (mins > 0 ? `${hours}h${mins}m` : `${hours}h`)
      : `${mins}m`
    return `${startStr} – ${endStr} (${durationStr})`
  } catch {
    return start
  }
}

function formatEventDate(dateStr: string): string {
  try {
    const date = dateStr.includes('T') ? parseISO(dateStr) : new Date(dateStr + 'T00:00:00')
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEE, MMM d')
  } catch {
    return dateStr
  }
}

function getEventColor(colorId: string | null, summary: string): string {
  if (colorId) {
    const colors: Record<string, string> = {
      '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73',
      '5': '#f6c026', '6': '#f5511d', '7': '#039be5', '8': '#616161',
      '9': '#3f51b5', '10': '#0b8043', '11': '#d60000',
    }
    return colors[colorId] ?? '#00D4FF'
  }
  // Keyword-based coloring
  const lower = summary.toLowerCase()
  if (lower.includes('meeting') || lower.includes('call')) return '#7986cb'
  if (lower.includes('deadline') || lower.includes('due')) return '#e67c73'
  if (lower.includes('lunch') || lower.includes('dinner')) return '#33b679'
  return '#00D4FF'
}

export function CalendarWidget() {
  const { events, connected, isLoading, error } = useCalendar()

  // Group events by date
  const eventsByDate: Record<string, typeof events> = {}
  for (const event of events) {
    const dateKey = formatEventDate(event.start)
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = []
    eventsByDate[dateKey].push(event)
  }

  return (
    <div className="card" style={{ padding: '16px', minHeight: '280px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} color="#00D4FF" />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '14px', color: '#E5E7EB' }}>
            Calendar
          </span>
        </div>
        {connected && (
          <span style={{ fontSize: '10px', color: '#00FF94', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FF94' }} />
            Google
          </span>
        )}
      </div>

      {/* Not connected */}
      {!connected && !isLoading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '32px 16px',
            textAlign: 'center',
          }}
        >
          <Link2 size={32} color="rgba(0,212,255,0.3)" />
          <div>
            <div style={{ color: '#E5E7EB', fontSize: '13px', fontFamily: 'Syne, sans-serif', fontWeight: 600, marginBottom: '4px' }}>
              Connect Google Calendar
            </div>
            <div style={{ color: '#4B5563', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
              See upcoming events on your dashboard
            </div>
          </div>
          <a
            href="/api/calendar/auth"
            style={{
              background: 'rgba(0,212,255,0.15)',
              border: '1px solid rgba(0,212,255,0.4)',
              borderRadius: '6px',
              color: '#00D4FF',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              padding: '8px 16px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Connect Calendar
          </a>
          {error && (
            <div style={{ color: '#FF4444', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '52px', borderRadius: '4px' }} />
          ))}
        </div>
      )}

      {/* Events */}
      {connected && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#4B5563', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '24px 0' }}>
              No upcoming events in the next 7 days
            </div>
          ) : (
            Object.entries(eventsByDate).map(([dateLabel, dateEvents]) => (
              <div key={dateLabel}>
                <div style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px', paddingLeft: '2px' }}>
                  {dateLabel}
                </div>
                {dateEvents.map((event) => {
                  const color = getEventColor(event.colorId, event.summary)
                  return (
                    <div
                      key={event.id}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderLeft: `3px solid ${color}`,
                        borderRadius: '0 6px 6px 0',
                        marginBottom: '4px',
                      }}
                    >
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '12px', color: '#E5E7EB', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {event.summary}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
                            <Clock size={10} />
                            {formatEventTime(event.start, event.end)}
                          </span>
                          {event.location && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                              <MapPin size={10} />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {event.htmlLink && (
                        <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" style={{ color: '#4B5563', flexShrink: 0 }}>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
