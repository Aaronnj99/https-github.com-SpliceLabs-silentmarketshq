'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Bell, Plus, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { useJarvisStore } from '@/store/apex'
import type { AlertItem } from '@/store/apex'

interface AlertHistoryItem {
  id: number
  alert_id: number | null
  coin: string
  condition: string
  target_price: number
  triggered_price: number
  triggered_at: string
}

interface AlertsResponse {
  alerts: AlertItem[]
  history: AlertHistoryItem[]
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json() as Promise<AlertsResponse>
  })

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return price.toFixed(4)
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function AlertManager() {
  const prices = useJarvisStore((s) => s.prices)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formCoin, setFormCoin] = useState('BTC')
  const [formCondition, setFormCondition] = useState<'above' | 'below'>('above')
  const [formPrice, setFormPrice] = useState('')
  const [formNote, setFormNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading, mutate } = useSWR<AlertsResponse>('/api/crypto/alerts', fetcher, {
    refreshInterval: 30000,
  })

  const activeAlerts = data?.alerts?.filter((a) => a.is_active) ?? []
  const inactiveAlerts = data?.alerts?.filter((a) => !a.is_active) ?? []
  const history = data?.history ?? []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formPrice || isNaN(parseFloat(formPrice))) {
      setError('Enter a valid price')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/crypto/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin: formCoin,
          condition: formCondition,
          target_price: parseFloat(formPrice),
          note: formNote || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Failed to create alert')
      }
      setShowAddForm(false)
      setFormPrice('')
      setFormNote('')
      await mutate()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/crypto/alerts?id=${id}`, { method: 'DELETE' })
      await mutate()
    } catch {
      // ignore
    }
  }

  const COIN_OPTIONS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'AVAX', 'LINK', 'DOT', 'NEAR', 'INJ', 'ARB']

  return (
    <div className="card" style={{ padding: '16px', minHeight: '280px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={16} color="#00D4FF" />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '14px', color: '#E5E7EB' }}>
            Price Alerts
          </span>
          {activeAlerts.length > 0 && (
            <span
              style={{
                background: 'rgba(0,212,255,0.15)',
                color: '#00D4FF',
                fontSize: '10px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '1px 6px',
                borderRadius: '10px',
              }}
            >
              {activeAlerts.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: showAddForm ? 'rgba(0,212,255,0.15)' : 'transparent',
            border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: '4px',
            color: '#00D4FF',
            fontSize: '11px',
            fontFamily: 'JetBrains Mono, monospace',
            padding: '4px 8px',
            cursor: 'pointer',
          }}
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: 'rgba(0,212,255,0.04)',
            border: '1px solid rgba(0,212,255,0.15)',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <select
              value={formCoin}
              onChange={(e) => setFormCoin(e.target.value)}
              style={{
                background: '#111827',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: '4px',
                color: '#E5E7EB',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '6px 8px',
              }}
            >
              {COIN_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={formCondition}
              onChange={(e) => setFormCondition(e.target.value as 'above' | 'below')}
              style={{
                background: '#111827',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: '4px',
                color: '#E5E7EB',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '6px 8px',
              }}
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
            <input
              type="number"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              placeholder="Target price"
              step="any"
              required
              style={{
                background: '#111827',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: '4px',
                color: '#E5E7EB',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '6px 8px',
                outline: 'none',
              }}
            />
          </div>
          <input
            type="text"
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            placeholder="Note (optional)"
            style={{
              width: '100%',
              background: '#111827',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: '4px',
              color: '#E5E7EB',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              padding: '6px 8px',
              outline: 'none',
              marginBottom: '8px',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <div style={{ color: '#FF4444', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                background: 'rgba(0,212,255,0.15)',
                border: '1px solid rgba(0,212,255,0.4)',
                borderRadius: '4px',
                color: '#00D4FF',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '6px',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Creating...' : 'Create Alert'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setError(null) }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: '#4B5563',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        {(['active', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: 'none',
              background: activeTab === tab ? 'rgba(0,212,255,0.1)' : 'transparent',
              color: activeTab === tab ? '#00D4FF' : '#4B5563',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'active' ? `Active (${activeAlerts.length})` : `History (${history.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '44px', borderRadius: '4px' }} />
          ))}
        </div>
      ) : activeTab === 'active' ? (
        activeAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#4B5563', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '24px 0' }}>
            <AlertTriangle size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
            No active alerts
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeAlerts.map((alert) => {
              const currentPrice = prices[alert.coin]?.price ?? 0
              const nearTarget = currentPrice > 0 && (
                alert.condition === 'above'
                  ? currentPrice / alert.target_price > 0.95
                  : currentPrice / alert.target_price < 1.05
              )

              return (
                <div
                  key={alert.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    background: nearTarget ? 'rgba(255,180,0,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${nearTarget ? 'rgba(255,180,0,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '6px',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: nearTarget ? '#FFB800' : '#00FF94',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: alert.coin === 'BTC' ? '#FFB800' : alert.coin === 'SOL' ? '#9945FF' : '#00D4FF', fontFamily: 'JetBrains Mono, monospace' }}>
                        {alert.coin}
                      </span>
                      <span style={{ fontSize: '11px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
                        {alert.condition}
                      </span>
                      <span style={{ fontSize: '12px', color: '#E5E7EB', fontFamily: 'JetBrains Mono, monospace' }}>
                        ${formatPrice(alert.target_price)}
                      </span>
                    </div>
                    {currentPrice > 0 && (
                      <div style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                        Current: ${formatPrice(currentPrice)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: '4px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}

            {inactiveAlerts.length > 0 && (
              <div style={{ color: '#4B5563', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                +{inactiveAlerts.length} triggered
              </div>
            )}
          </div>
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#4B5563', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '24px 0' }}>
              <Clock size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
              No alert history yet
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
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
                <CheckCircle2 size={14} color="#00FF94" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#E5E7EB', fontFamily: 'JetBrains Mono, monospace' }}>
                    {item.coin} {item.condition} ${formatPrice(item.target_price)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
                    Triggered @ ${formatPrice(item.triggered_price)} · {formatTime(item.triggered_at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
