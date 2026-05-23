'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Settings, Check, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react'

interface SettingSection {
  id: string
  title: string
  description: string
}

const SECTIONS: SettingSection[] = [
  { id: 'crypto', title: 'Crypto & Market', description: 'Coins to track and API keys' },
  { id: 'calendar', title: 'Google Calendar', description: 'Connect your calendar' },
  { id: 'obsidian', title: 'Obsidian Vault', description: 'Link your notes vault' },
  { id: 'solana', title: 'Solana Wallet', description: 'Track your wallet' },
  { id: 'notifications', title: 'Notifications', description: 'Desktop notification settings' },
]

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#0D1117',
        border: '1px solid rgba(0,212,255,0.15)',
        borderRadius: '10px',
        padding: '20px 24px',
        marginBottom: '16px',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 4px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '16px', color: '#E5E7EB' }}>
          {title}
        </h2>
        <p style={{ margin: 0, fontSize: '12px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
          {description}
        </p>
      </div>
      {children}
    </div>
  )
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
        color: ok ? '#00FF94' : '#4B5563',
        background: ok ? 'rgba(0,255,148,0.08)' : 'rgba(255,255,255,0.04)',
        padding: '3px 8px',
        borderRadius: '4px',
        border: `1px solid ${ok ? 'rgba(0,255,148,0.2)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {ok ? <Check size={10} /> : <AlertCircle size={10} />}
      {label}
    </span>
  )
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const calendarStatus = searchParams.get('calendar')

  const [envVars, setEnvVars] = useState<Record<string, boolean>>({
    GOOGLE_CLIENT_ID: false,
    GOOGLE_CLIENT_SECRET: false,
    SOLANA_WALLET_ADDRESS: false,
    OBSIDIAN_VAULT_PATH: false,
    COINGECKO_API_KEY: false,
    HELIUS_API_KEY: false,
  })

  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string }>>({})

  useEffect(() => {
    // Check calendar status from redirect
    if (calendarStatus === 'connected') {
      setCalendarConnected(true)
    }

    // Fetch calendar status from API
    fetch('/api/calendar/events')
      .then((r) => r.json())
      .then((data: { connected?: boolean }) => {
        setCalendarConnected(data.connected ?? false)
        setCalendarLoading(false)
      })
      .catch(() => setCalendarLoading(false))
  }, [calendarStatus])

  const testEndpoint = async (name: string, url: string) => {
    setTestingConnection(name)
    try {
      const res = await fetch(url)
      const data = await res.json() as { error?: string; configured?: boolean }
      if (res.ok) {
        setTestResults((p) => ({
          ...p,
          [name]: {
            ok: data.configured !== false,
            message: data.configured === false ? 'Not configured' : 'Connected',
          },
        }))
      } else {
        setTestResults((p) => ({
          ...p,
          [name]: { ok: false, message: data.error ?? `HTTP ${res.status}` },
        }))
      }
    } catch (e) {
      setTestResults((p) => ({
        ...p,
        [name]: { ok: false, message: e instanceof Error ? e.message : 'Connection failed' },
      }))
    } finally {
      setTestingConnection(null)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#111827',
    border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: '6px',
    color: '#E5E7EB',
    fontSize: '13px',
    fontFamily: 'JetBrains Mono, monospace',
    padding: '10px 12px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    color: '#4B5563',
    fontFamily: 'JetBrains Mono, monospace',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: '6px',
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 0' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <Settings size={20} color="#00D4FF" />
        <h1 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '22px', color: '#E5E7EB' }}>
          Settings
        </h1>
      </div>

      {/* Success banner for calendar */}
      {calendarStatus === 'connected' && (
        <div
          style={{
            background: 'rgba(0,255,148,0.08)',
            border: '1px solid rgba(0,255,148,0.2)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#00FF94',
            fontSize: '13px',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <Check size={16} />
          Google Calendar connected successfully!
        </div>
      )}

      {calendarStatus === 'error' && (
        <div
          style={{
            background: 'rgba(255,68,68,0.08)',
            border: '1px solid rgba(255,68,68,0.2)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#FF4444',
            fontSize: '13px',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <AlertCircle size={16} />
          Calendar connection failed. Check your OAuth credentials in .env.local
        </div>
      )}

      {/* Crypto Section */}
      <SectionCard title="Crypto & Market" description="Configure which coins to track and optional API keys">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Default Coins</label>
            <input
              defaultValue="BTC,SOL,ETH"
              readOnly
              style={inputStyle}
              placeholder="BTC,SOL,ETH"
            />
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
              Set NEXT_PUBLIC_DEFAULT_COINS in .env.local to change
            </p>
          </div>
          <div>
            <label style={labelStyle}>CoinGecko API Key (optional)</label>
            <input
              type="password"
              placeholder="Enter to unlock higher rate limits"
              style={inputStyle}
            />
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
              Free tier: 10-50 calls/min. Pro key increases limits significantly.{' '}
              <a href="https://www.coingecko.com/en/api" target="_blank" rel="noopener noreferrer" style={{ color: '#00D4FF', textDecoration: 'none' }}>
                Get API key →
              </a>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => testEndpoint('crypto', '/api/crypto/prices')}
              disabled={testingConnection === 'crypto'}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
                borderRadius: '6px', color: '#00D4FF', fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace', padding: '8px 16px', cursor: 'pointer',
              }}
            >
              {testingConnection === 'crypto' ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              Test Connection
            </button>
            {testResults.crypto && (
              <StatusBadge ok={testResults.crypto.ok} label={testResults.crypto.message} />
            )}
          </div>
        </div>
      </SectionCard>

      {/* Calendar Section */}
      <SectionCard title="Google Calendar" description="Connect your Google Calendar to see upcoming events">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <StatusBadge
              ok={calendarConnected}
              label={calendarLoading ? 'Checking...' : calendarConnected ? 'Connected' : 'Not connected'}
            />
            {!calendarConnected && !calendarLoading && (
              <a
                href="/api/calendar/auth"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.4)',
                  borderRadius: '6px', color: '#00D4FF', fontSize: '12px',
                  fontFamily: 'JetBrains Mono, monospace', padding: '8px 16px', textDecoration: 'none',
                }}
              >
                <ExternalLink size={12} />
                Connect with Google
              </a>
            )}
          </div>

          <div>
            <label style={labelStyle}>Setup Instructions</label>
            <ol style={{ margin: 0, padding: '0 0 0 16px', color: '#4B5563', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', lineHeight: '2' }}>
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#00D4FF' }}>Google Cloud Console</a></li>
              <li>Create a new project or select existing</li>
              <li>Enable the Google Calendar API</li>
              <li>Create OAuth 2.0 credentials (Web Application)</li>
              <li>Add <code style={{ color: '#9945FF' }}>http://localhost:3000/api/calendar/callback</code> as redirect URI</li>
              <li>Copy client ID and secret to .env.local</li>
            </ol>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Client ID</label>
              <input type="password" placeholder="Set in .env.local" readOnly style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Client Secret</label>
              <input type="password" placeholder="Set in .env.local" readOnly style={inputStyle} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Obsidian Section */}
      <SectionCard title="Obsidian Vault" description="Connect your Obsidian vault to browse and search notes">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Vault Path</label>
            <input
              type="text"
              placeholder="/Users/yourname/Documents/Obsidian/Vault"
              readOnly
              style={inputStyle}
            />
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
              Set OBSIDIAN_VAULT_PATH in .env.local to the absolute path of your vault directory
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => testEndpoint('obsidian', '/api/obsidian/notes?limit=1')}
              disabled={testingConnection === 'obsidian'}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(153,69,255,0.1)', border: '1px solid rgba(153,69,255,0.3)',
                borderRadius: '6px', color: '#9945FF', fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace', padding: '8px 16px', cursor: 'pointer',
              }}
            >
              {testingConnection === 'obsidian' ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              Test Vault Access
            </button>
            {testResults.obsidian && (
              <StatusBadge ok={testResults.obsidian.ok} label={testResults.obsidian.message} />
            )}
          </div>
        </div>
      </SectionCard>

      {/* Solana Section */}
      <SectionCard title="Solana Wallet" description="Track your Solana wallet balance and transactions">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Wallet Address</label>
            <input
              type="text"
              placeholder="Your Solana public key (e.g., 7xKXtg2...)"
              readOnly
              style={inputStyle}
            />
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
              Set SOLANA_WALLET_ADDRESS in .env.local — read-only, never your private key
            </p>
          </div>
          <div>
            <label style={labelStyle}>Helius API Key (optional)</label>
            <input
              type="password"
              placeholder="For enhanced token metadata and NFT data"
              readOnly
              style={inputStyle}
            />
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
              <a href="https://helius.xyz" target="_blank" rel="noopener noreferrer" style={{ color: '#9945FF' }}>
                Get a free Helius API key →
              </a>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => testEndpoint('solana', '/api/solana/wallet')}
              disabled={testingConnection === 'solana'}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(153,69,255,0.1)', border: '1px solid rgba(153,69,255,0.3)',
                borderRadius: '6px', color: '#9945FF', fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace', padding: '8px 16px', cursor: 'pointer',
              }}
            >
              {testingConnection === 'solana' ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              Test Wallet
            </button>
            {testResults.solana && (
              <StatusBadge ok={testResults.solana.ok} label={testResults.solana.message} />
            )}
          </div>
        </div>
      </SectionCard>

      {/* Notifications Section */}
      <SectionCard title="Notifications" description="Configure desktop notifications for alerts and reminders">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', color: '#E5E7EB', fontFamily: 'JetBrains Mono, monospace' }}>
                Price Alert Notifications
              </div>
              <div style={{ fontSize: '11px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                Desktop notifications when alerts trigger
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
              Run <code style={{ color: '#00D4FF' }}>npm run worker</code> to enable
            </div>
          </div>

          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(0,212,255,0.04)',
              border: '1px solid rgba(0,212,255,0.1)',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace', lineHeight: '1.8' }}>
              <strong style={{ color: '#00D4FF' }}>Background Worker Setup</strong><br />
              The alert worker runs independently to check prices every 60 seconds and send desktop notifications when alerts trigger.<br /><br />
              Start with: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px', color: '#00FF94' }}>npm run worker</code>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* .env.local Reference */}
      <SectionCard title=".env.local Reference" description="Copy this template to create your configuration file">
        <pre
          style={{
            background: '#080A0F',
            border: '1px solid rgba(0,212,255,0.1)',
            borderRadius: '6px',
            padding: '16px',
            fontSize: '11px',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#9CA3AF',
            overflowX: 'auto',
            margin: 0,
            lineHeight: '1.8',
          }}
        >
          {`# Google Calendar
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
GOOGLE_REFRESH_TOKEN=  # Auto-populated after first auth

# Solana
SOLANA_WALLET_ADDRESS=your_wallet_public_key
HELIUS_API_KEY=  # Optional, for better token metadata

# Obsidian
OBSIDIAN_VAULT_PATH=/absolute/path/to/your/vault

# CoinGecko (optional)
COINGECKO_API_KEY=

# App
NEXT_PUBLIC_APP_NAME=APEX
NEXT_PUBLIC_DEFAULT_COINS=BTC,SOL,ETH`}
        </pre>
      </SectionCard>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '24px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
        Loading settings...
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
