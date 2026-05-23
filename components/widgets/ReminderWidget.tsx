'use client'
import { useState, useRef } from 'react'
import { BellRing, Plus, Check, Trash2, Clock, AlertCircle } from 'lucide-react'
import { useReminders } from '@/hooks/useReminders'
import { format, isPast, isToday, isTomorrow, parseISO, formatDistanceToNow } from 'date-fns'
import type { ReminderItem } from '@/store/apex'

function PriorityDot({ priority }: { priority: 'low' | 'normal' | 'high' }) {
  const colors = {
    low: '#4B5563',
    normal: '#00D4FF',
    high: '#FF4444',
  }
  return (
    <div
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: colors[priority],
        flexShrink: 0,
      }}
    />
  )
}

function formatDueDate(dueAt: string | null): { label: string; isOverdue: boolean } {
  if (!dueAt) return { label: '', isOverdue: false }
  try {
    const date = parseISO(dueAt)
    const overdue = isPast(date) && !isToday(date)
    if (overdue) return { label: formatDistanceToNow(date, { addSuffix: true }), isOverdue: true }
    if (isToday(date)) return { label: 'Today', isOverdue: false }
    if (isTomorrow(date)) return { label: 'Tomorrow', isOverdue: false }
    return { label: format(date, 'MMM d, yyyy'), isOverdue: false }
  } catch {
    return { label: dueAt, isOverdue: false }
  }
}

function ReminderRow({
  reminder,
  onComplete,
  onDelete,
}: {
  reminder: ReminderItem
  onComplete: (id: number) => void
  onDelete: (id: number) => void
}) {
  const { label: dueLabel, isOverdue } = formatDueDate(reminder.due_at)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '8px 10px',
        background: isOverdue ? 'rgba(255,68,68,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isOverdue ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '6px',
        transition: 'opacity 0.2s ease',
      }}
    >
      <PriorityDot priority={reminder.priority} />
      <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
        <div style={{ fontSize: '12px', color: '#E5E7EB', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {reminder.title}
        </div>
        {dueLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
            {isOverdue ? <AlertCircle size={10} color="#FF4444" /> : <Clock size={10} color="#4B5563" />}
            <span style={{ fontSize: '10px', color: isOverdue ? '#FF4444' : '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
              {dueLabel}
            </span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button
          onClick={() => onComplete(reminder.id)}
          title="Mark complete"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00FF94', padding: '2px' }}
        >
          <Check size={14} />
        </button>
        <button
          onClick={() => onDelete(reminder.id)}
          title="Delete"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: '2px' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export function ReminderWidget() {
  const { reminders, isLoading, error, create, complete, remove } = useReminders()
  const [quickTitle, setQuickTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTitle.trim()) return
    setAdding(true)
    try {
      await create(quickTitle.trim())
      setQuickTitle('')
    } catch {
      // ignore
    } finally {
      setAdding(false)
    }
  }

  const overdueCount = reminders.filter((r) => {
    if (!r.due_at) return false
    try {
      const date = parseISO(r.due_at)
      return isPast(date) && !isToday(date)
    } catch {
      return false
    }
  }).length

  const sorted = [...reminders].sort((a, b) => {
    // Overdue first, then by priority, then by due date
    const aOverdue = a.due_at ? isPast(parseISO(a.due_at)) && !isToday(parseISO(a.due_at)) : false
    const bOverdue = b.due_at ? isPast(parseISO(b.due_at)) && !isToday(parseISO(b.due_at)) : false
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    const pOrder = { high: 0, normal: 1, low: 2 }
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority]

    if (a.due_at && b.due_at) return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    if (a.due_at) return -1
    if (b.due_at) return 1
    return 0
  })

  return (
    <div className="card" style={{ padding: '16px', minHeight: '280px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BellRing size={16} color="#00D4FF" />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '14px', color: '#E5E7EB' }}>
            Reminders
          </span>
          {overdueCount > 0 && (
            <span
              style={{
                background: 'rgba(255,68,68,0.15)',
                color: '#FF4444',
                fontSize: '10px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '1px 6px',
                borderRadius: '10px',
              }}
            >
              {overdueCount} overdue
            </span>
          )}
        </div>
        <span style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
          {reminders.length} active
        </span>
      </div>

      {/* Reminders list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', marginBottom: '8px' }}>
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '44px', borderRadius: '4px' }} />
          ))
        ) : error ? (
          <div style={{ color: '#FF4444', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '16px 0' }}>
            {error}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#4B5563', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '24px 0' }}>
            <BellRing size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
            No reminders — add one below
          </div>
        ) : (
          sorted.map((reminder) => (
            <ReminderRow
              key={reminder.id}
              reminder={reminder}
              onComplete={complete}
              onDelete={remove}
            />
          ))
        )}
      </div>

      {/* Quick add */}
      <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: '6px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '6px', padding: '0 10px' }}>
          <Plus size={14} color="#4B5563" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Add reminder..."
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
  )
}
