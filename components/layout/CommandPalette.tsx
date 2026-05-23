'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, LayoutDashboard, TrendingUp, FileText, Bell, Wallet, Settings, X, type LucideProps } from 'lucide-react'
import { useJarvisStore } from '@/store/apex'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  action: () => void
  category: string
}

export function CommandPalette() {
  const router = useRouter()
  const open = useJarvisStore((s) => s.ui.commandPaletteOpen)
  const setOpen = useJarvisStore((s) => s.setCommandPaletteOpen)
  const notes = useJarvisStore((s) => s.obsidianNotes)
  const reminders = useJarvisStore((s) => s.reminders)
  const alerts = useJarvisStore((s) => s.alerts)

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const navigate = useCallback(
    (href: string) => {
      router.push(href)
      setOpen(false)
      setQuery('')
    },
    [router, setOpen]
  )

  const staticCommands: CommandItem[] = [
    { id: 'nav-home', label: 'Dashboard', description: 'Go to main dashboard', icon: LayoutDashboard, action: () => navigate('/'), category: 'Navigation' },
    { id: 'nav-crypto', label: 'Crypto', description: 'View crypto prices & charts', icon: TrendingUp, action: () => navigate('/crypto'), category: 'Navigation' },
    { id: 'nav-notes', label: 'Notes', description: 'Browse Obsidian notes', icon: FileText, action: () => navigate('/notes'), category: 'Navigation' },
    { id: 'nav-alerts', label: 'Alerts', description: 'Manage price alerts', icon: Bell, action: () => navigate('/alerts'), category: 'Navigation' },
    { id: 'nav-wallet', label: 'Wallet', description: 'View Solana wallet', icon: Wallet, action: () => navigate('/wallet'), category: 'Navigation' },
    { id: 'nav-settings', label: 'Settings', description: 'Configure APEX', icon: Settings, action: () => navigate('/settings'), category: 'Navigation' },
  ]

  const dynamicCommands: CommandItem[] = [
    ...notes.slice(0, 5).map((note) => ({
      id: `note-${note.filename}`,
      label: note.title,
      description: note.preview.slice(0, 80),
      icon: FileText,
      action: () => {
        navigate('/notes')
      },
      category: 'Notes',
    })),
    ...reminders
      .filter((r) => !r.is_done)
      .slice(0, 5)
      .map((r) => ({
        id: `reminder-${r.id}`,
        label: r.title,
        description: r.due_at ? `Due: ${new Date(r.due_at).toLocaleDateString()}` : 'No due date',
        icon: Bell,
        action: () => navigate('/'),
        category: 'Reminders',
      })),
    ...alerts
      .filter((a) => a.is_active)
      .slice(0, 5)
      .map((a) => ({
        id: `alert-${a.id}`,
        label: `${a.coin} ${a.condition} $${a.target_price.toLocaleString()}`,
        description: 'Active price alert',
        icon: Bell,
        action: () => navigate('/alerts'),
        category: 'Alerts',
      })),
  ]

  const allCommands = [...staticCommands, ...dynamicCommands]

  const filtered = query
    ? allCommands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(query.toLowerCase()) ||
          cmd.category.toLowerCase().includes(query.toLowerCase())
      )
    : staticCommands

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      } else if (e.key === 'Enter' && filtered[selected]) {
        filtered[selected].action()
        setQuery('')
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, filtered, selected, setOpen])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        background: 'rgba(8,10,15,0.8)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div
        style={{
          width: '560px',
          maxWidth: 'calc(100vw - 32px)',
          background: '#0D1117',
          border: '1px solid rgba(0,212,255,0.3)',
          borderRadius: '12px',
          boxShadow: '0 0 40px rgba(0,212,255,0.1), 0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(0,212,255,0.1)',
          }}
        >
          <Search size={18} color="#4B5563" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, notes, alerts..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#E5E7EB',
              fontSize: '14px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#4B5563', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
              No results for &quot;{query}&quot;
            </div>
          ) : (
            (() => {
              let lastCategory = ''
              return filtered.map((cmd, idx) => {
                const showCategory = cmd.category !== lastCategory
                lastCategory = cmd.category
                const Icon = cmd.icon
                return (
                  <div key={cmd.id}>
                    {showCategory && (
                      <div
                        style={{
                          padding: '6px 12px 2px',
                          fontSize: '10px',
                          color: '#4B5563',
                          letterSpacing: '0.1em',
                          fontFamily: 'JetBrains Mono, monospace',
                          textTransform: 'uppercase',
                        }}
                      >
                        {cmd.category}
                      </div>
                    )}
                    <button
                      onClick={() => { cmd.action(); setQuery('') }}
                      onMouseEnter={() => setSelected(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '10px 12px',
                        background: idx === selected ? 'rgba(0,212,255,0.08)' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Icon size={16} color={idx === selected ? '#00D4FF' : '#4B5563'} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', color: idx === selected ? '#00D4FF' : '#E5E7EB', fontFamily: 'JetBrains Mono, monospace' }}>
                          {cmd.label}
                        </div>
                        {cmd.description && (
                          <div style={{ fontSize: '11px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cmd.description}
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                )
              })
            })()
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid rgba(0,212,255,0.1)',
            display: 'flex',
            gap: '16px',
            fontSize: '11px',
            color: '#4B5563',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  )
}
