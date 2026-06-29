'use client'
import { useState } from 'react'
import { Radar, ShieldAlert, Newspaper, SunMedium, Play, ChevronDown } from 'lucide-react'
import { useAgentJobs, type AgentStation } from '@/hooks/useAgentJobs'
import type { AgentJobRun } from '@/lib/db'

const STATION_ICONS: Record<string, typeof Radar> = {
  market_scanner: Radar,
  portfolio_risk: ShieldAlert,
  news_digest: Newspaper,
  daily_briefing: SunMedium,
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'never run'
  const diffMs = Date.now() - new Date(iso.replace(' ', 'T') + 'Z').getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 5) return 'just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

function statusColor(status: AgentJobRun['status'] | undefined): string {
  if (status === 'running') return 'var(--gold)'
  if (status === 'complete') return 'var(--success)'
  if (status === 'error') return 'var(--danger)'
  return 'var(--muted)'
}

function StationCard({
  station,
  onRun,
  isTriggering,
}: {
  station: AgentStation
  onRun: (key: string) => void
  isTriggering: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const Icon = STATION_ICONS[station.key] ?? Radar
  const run = station.latestRun
  const color = statusColor(run?.status)
  const isRunning = run?.status === 'running' || isTriggering

  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        background: 'rgba(255,255,255,0.02)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={14} color="var(--cyan)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'inherit' }}>
            {station.name}
          </span>
        </div>
        <div
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 6px ${color}`,
            marginTop: '3px',
            animation: isRunning ? 'pulse 1.2s ease-in-out infinite' : undefined,
          }}
        />
      </div>

      <div style={{ fontSize: '10px', color: 'var(--muted)', lineHeight: '1.4' }}>
        {station.description}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
          {isTriggering ? 'running…' : run ? relativeTime(run.completed_at ?? run.started_at) : 'never run'}
        </span>
        <button
          onClick={() => onRun(station.key)}
          disabled={isRunning}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: '1px solid var(--cyan-dim)',
            borderRadius: '4px',
            color: isRunning ? 'var(--muted)' : 'var(--cyan)',
            cursor: isRunning ? 'default' : 'pointer',
            fontSize: '10px',
            padding: '3px 8px',
            fontFamily: 'inherit',
          }}
        >
          <Play size={9} />
          RUN
        </button>
      </div>

      {run?.output && (
        <>
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '10px',
              padding: 0,
              fontFamily: 'inherit',
            }}
          >
            <ChevronDown size={10} style={{ transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
            {expanded ? 'hide output' : 'view output'}
          </button>
          {expanded && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '6px',
                padding: '8px',
              }}
            >
              {run.output}
            </div>
          )}
        </>
      )}
      {run?.status === 'error' && run.error && (
        <div style={{ fontSize: '10px', color: 'var(--danger)' }}>{run.error}</div>
      )}
    </div>
  )
}

export function AgentOps() {
  const { stations, history, isLoading, runNow } = useAgentJobs()
  const [triggering, setTriggering] = useState<Set<string>>(new Set())
  const [globalError, setGlobalError] = useState<string | null>(null)

  async function handleRun(key: string) {
    setGlobalError(null)
    setTriggering((prev) => new Set(prev).add(key))
    try {
      await runNow(key)
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Job failed')
    } finally {
      setTriggering((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--success)',
              boxShadow: '0 0 6px var(--success)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <span className="font-heading" style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
            AGENT OPS
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
          {stations.length} autonomous job{stations.length === 1 ? '' : 's'} online
        </span>
      </div>

      {globalError && (
        <div style={{ fontSize: '11px', color: 'var(--danger)', marginBottom: '10px' }}>{globalError}</div>
      )}

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '8px' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {stations.map((s) => (
            <StationCard
              key={s.key}
              station={s}
              onRun={handleRun}
              isTriggering={triggering.has(s.key)}
            />
          ))}
        </div>
      )}

      {/* Activity log feed */}
      <div
        style={{
          marginTop: '14px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '10px',
          maxHeight: '120px',
          overflowY: 'auto',
          fontSize: '10px',
          fontFamily: 'inherit',
          lineHeight: '1.7',
        }}
      >
        {history.length === 0 && (
          <div style={{ color: 'var(--muted)' }}>No agent activity yet. Click RUN on a station above.</div>
        )}
        {history.map((h) => (
          <div key={h.id} style={{ display: 'flex', gap: '8px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--muted)', minWidth: '60px' }}>
              {new Date(h.created_at.replace(' ', 'T') + 'Z').toLocaleTimeString()}
            </span>
            <span style={{ color: statusColor(h.status) }}>
              {h.status === 'running' ? '▶' : h.status === 'complete' ? '✓' : '✗'}
            </span>
            <span>{h.job_name}</span>
            <span style={{ color: 'var(--muted)' }}>
              {h.status === 'running' ? 'running...' : h.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
