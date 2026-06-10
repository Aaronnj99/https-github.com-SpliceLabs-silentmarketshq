'use client'
import { useMemo, useState, useRef } from 'react'
import {
  Sun,
  Sunset,
  Moon,
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  AlertCircle,
  Flame,
  Plus,
  PartyPopper,
} from 'lucide-react'
import { useCalendar } from '@/hooks/useCalendar'
import { useReminders } from '@/hooks/useReminders'
import { format, isToday, isPast, parseISO } from 'date-fns'
import type { ReminderItem } from '@/store/jarvis'

const PRIORITY_COLOR: Record<ReminderItem['priority'], string> = {
  low: '#4B5563',
  normal: '#00D4FF',
  high: '#FF4444',
}

function getGreeting(): { text: string; Icon: typeof Sun } {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Good morning', Icon: Sun }
  if (hour < 18) return { text: 'Good afternoon', Icon: Sunset }
  return { text: 'Good evening', Icon: Moon }
}

interface AgendaItem {
  id: string
  time: string
  sortKey: number
  kind: 'event' | 'reminder'
  title: string
  subtitle?: string
  color: string
  reminderId?: number
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ padding: '14px 16px', flex: 1 }}>
      <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Syne, sans-serif', color }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '2px' }}>
        {label}
      </div>
    </div>
  )
}

export function TodayAgenda() {
  const { events, isLoading: calendarLoading } = useCalendar()
  const { reminders, isLoading: remindersLoading, create, complete } = useReminders()
  const [quickTitle, setQuickTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const greeting = getGreeting()
  const today = new Date()

  const agendaItems = useMemo<AgendaItem[]>(() => {
    const items: AgendaItem[] = []

    for (const event of events) {
      const isAllDay = !event.start.includes('T')
      const startDate = isAllDay ? new Date(`${event.start}T00:00:00`) : parseISO(event.start)
      if (!isToday(startDate)) continue

      items.push({
        id: `event-${event.id}`,
        time: isAllDay ? 'All day' : format(startDate, 'HH:mm'),
        sortKey: isAllDay ? -1 : startDate.getTime(),
        kind: 'event',
        title: event.summary,
        subtitle: event.location ?? undefined,
        color: '#00D4FF',
      })
    }

    for (const reminder of reminders) {
      if (reminder.is_done || !reminder.due_at) continue
      const due = parseISO(reminder.due_at)
      if (!isToday(due)) continue

      items.push({
        id: `reminder-${reminder.id}`,
        time: format(due, 'HH:mm'),
        sortKey: due.getTime(),
        kind: 'reminder',
        title: reminder.title,
        subtitle: reminder.description ?? undefined,
        color: PRIORITY_COLOR[reminder.priority],
        reminderId: reminder.id,
      })
    }

    return items.sort((a, b) => a.sortKey - b.sortKey)
  }, [events, reminders])

  const overdueReminders = useMemo(
    () =>
      reminders.filter(
        (r) => !r.is_done && r.due_at && isPast(parseISO(r.due_at)) && !isToday(parseISO(r.due_at))
      ),
    [reminders]
  )

  const focusItems = useMemo(
    () =>
      reminders
        .filter((r) => !r.is_done && !r.due_at)
        .sort((a, b) => {
          const order = { high: 0, normal: 1, low: 2 }
          return order[a.priority] - order[b.priority]
        }),
    [reminders]
  )

  const eventsToday = agendaItems.filter((i) => i.kind === 'event').length
  const dueToday = agendaItems.filter((i) => i.kind === 'reminder').length

  const isLoading = calendarLoading || remindersLoading

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTitle.trim()) return
    setAdding(true)
    try {
      await create(quickTitle.trim())
      setQuickTitle('')
      inputRef.current?.focus()
    } catch {
      // ignore
    } finally {
      setAdding(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '100%' }}>
      {/* Header */}
      <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <greeting.Icon size={20} color="#00D4FF" />
            <h1 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '22px', color: '#E5E7EB' }}>
              {greeting.text}
            </h1>
          </div>
          <div style={{ fontSize: '13px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
            {format(today, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <StatCard label="Events" value={eventsToday} color="#00D4FF" />
          <StatCard label="Due Today" value={dueToday} color="#00FF94" />
          <StatCard label="Overdue" value={overdueReminders.length} color="#FF4444" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Agenda */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CalendarDays size={16} color="#00D4FF" />
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '14px', color: '#E5E7EB' }}>
              Today&apos;s Agenda
            </span>
          </div>

          {/* Overdue */}
          {overdueReminders.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', color: '#FF4444', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                Overdue
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {overdueReminders.map((reminder) => (
                  <div
                    key={`overdue-${reminder.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      background: 'rgba(255,68,68,0.04)',
                      border: '1px solid rgba(255,68,68,0.2)',
                      borderRadius: '6px',
                    }}
                  >
                    <button
                      onClick={() => complete(reminder.id)}
                      title="Mark complete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF4444', padding: 0, display: 'flex' }}
                    >
                      <AlertCircle size={14} />
                    </button>
                    <span style={{ flex: 1, fontSize: '12px', color: '#E5E7EB', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {reminder.title}
                    </span>
                    <span style={{ fontSize: '10px', color: '#FF4444', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                      {format(parseISO(reminder.due_at!), 'MMM d')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agenda items */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
            {isLoading ? (
              [1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: '48px', borderRadius: '6px' }} />)
            ) : agendaItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#4B5563', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '40px 0' }}>
                <PartyPopper size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                Nothing scheduled for today — clear day ahead
              </div>
            ) : (
              agendaItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderLeft: `3px solid ${item.color}`,
                    borderRadius: '0 6px 6px 0',
                  }}
                >
                  <div style={{ width: '52px', flexShrink: 0, fontSize: '11px', color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace' }}>
                    {item.time}
                  </div>
                  {item.kind === 'reminder' && item.reminderId !== undefined ? (
                    <button
                      onClick={() => complete(item.reminderId!)}
                      title="Mark complete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.color, padding: 0, display: 'flex', flexShrink: 0 }}
                    >
                      <Circle size={14} />
                    </button>
                  ) : (
                    <Clock size={14} color={item.color} style={{ flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: '#E5E7EB', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
                        {item.kind === 'event' && <MapPin size={10} />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subtitle}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Focus + quick add */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Flame size={16} color="#FF4444" />
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '14px', color: '#E5E7EB' }}>
                Focus
              </span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
              {isLoading ? (
                [1, 2].map((i) => <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '6px' }} />)
              ) : focusItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#4B5563', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '24px 0' }}>
                  No undated priorities
                </div>
              ) : (
                focusItems.map((reminder) => (
                  <div
                    key={`focus-${reminder.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '6px',
                    }}
                  >
                    <button
                      onClick={() => complete(reminder.id)}
                      title="Mark complete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIORITY_COLOR[reminder.priority], padding: 0, display: 'flex' }}
                    >
                      <Circle size={14} />
                    </button>
                    <span style={{ flex: 1, fontSize: '12px', color: '#E5E7EB', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {reminder.title}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick add */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <CheckCircle2 size={16} color="#00FF94" />
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '14px', color: '#E5E7EB' }}>
                Quick Add
              </span>
            </div>
            <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: '6px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '6px', padding: '0 10px' }}>
                <Plus size={14} color="#4B5563" style={{ flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Add a task for today..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#E5E7EB',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                    padding: '8px 0',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={adding || !quickTitle.trim()}
                style={{
                  background: quickTitle.trim() ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(0,212,255,0.3)',
                  borderRadius: '6px',
                  color: quickTitle.trim() ? '#00D4FF' : '#4B5563',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '8px 12px',
                  cursor: quickTitle.trim() ? 'pointer' : 'default',
                }}
              >
                {adding ? '...' : 'Add'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
