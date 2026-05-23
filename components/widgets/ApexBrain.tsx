'use client'

import { useState, useRef, useEffect } from 'react'
import { useApexStore } from '@/store/apex'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ApexBrain() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState<string | null>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [briefError, setBriefError] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const prices = useApexStore((s) => s.prices)
  const alerts = useApexStore((s) => s.alerts)
  const reminders = useApexStore((s) => s.reminders)
  const context = { prices, alerts, reminders }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchBrief() {
    setBriefLoading(true)
    setBriefError(false)
    try {
      const res = await fetch('/api/ai/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      })
      const data = await res.json()
      if (data.error) setBriefError(true)
      else setBrief(data.brief)
    } catch {
      setBriefError(true)
    } finally {
      setBriefLoading(false)
    }
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: Message = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, context }),
      })
      const data = await res.json()
      if (data.reply) setMessages([...next, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Connection error. Check ANTHROPIC_API_KEY.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '420px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--cyan-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
          <span className="font-heading" style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em' }}>APEX BRAIN</span>
        </div>
        <button onClick={fetchBrief} disabled={briefLoading} style={{ background: 'transparent', border: '1px solid var(--cyan-dim)', borderRadius: '4px', color: briefLoading ? 'var(--muted)' : 'var(--cyan)', cursor: briefLoading ? 'default' : 'pointer', fontSize: '11px', padding: '4px 10px', fontFamily: 'inherit' }}>
          {briefLoading ? 'THINKING...' : '⚡ MARKET BRIEF'}
        </button>
      </div>

      {(brief || briefError) && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cyan-dim)', background: 'rgba(0,212,255,0.03)' }}>
          {briefError
            ? <p style={{ color: 'var(--danger)', fontSize: '12px', margin: 0 }}>Set ANTHROPIC_API_KEY to enable AI features.</p>
            : <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{brief}</p>
          }
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: '1.8' }}>
              Ask APEX anything about your portfolio.<br />
              <span style={{ color: 'rgba(0,212,255,0.3)' }}>"Is SOL showing strength?" · "Summarize my alerts" · "What should I watch today?"</span>
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', lineHeight: '1.6', background: m.role === 'user' ? 'rgba(0,212,255,0.1)' : 'var(--surface-2)', border: m.role === 'user' ? '1px solid var(--cyan-dim)' : '1px solid rgba(255,255,255,0.05)', color: m.role === 'user' ? 'var(--cyan)' : 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex' }}>
            <div style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '12px', background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="skeleton" style={{ display: 'inline-block', width: '80px', height: '12px' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--cyan-dim)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Ask APEX..."
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit' }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ background: loading || !input.trim() ? 'transparent' : 'rgba(0,212,255,0.1)', border: '1px solid var(--cyan-dim)', borderRadius: '4px', color: loading || !input.trim() ? 'var(--muted)' : 'var(--cyan)', cursor: loading || !input.trim() ? 'default' : 'pointer', fontSize: '11px', padding: '4px 10px', fontFamily: 'inherit' }}>
          SEND
        </button>
      </div>
    </div>
  )
}
