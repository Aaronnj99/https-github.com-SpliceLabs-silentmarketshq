'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Settings, Wifi, WifiOff } from 'lucide-react'
import { useJarvisStore } from '@/store/jarvis'
import { CryptoPriceBar } from '@/components/widgets/CryptoPriceBar'

function Clock() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    function update() {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour12: false }))
      setDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#00D4FF', fontFamily: 'JetBrains Mono, monospace' }}>
        {time}
      </div>
      <div style={{ fontSize: '11px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
        {date}
      </div>
    </div>
  )
}

export function TopBar() {
  const wsConnected = useJarvisStore((s) => s.wsConnected)
  const toggleCommandPalette = useJarvisStore((s) => s.toggleCommandPalette)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggleCommandPalette()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleCommandPalette])

  return (
    <header
      style={{
        height: '48px',
        background: '#0D1117',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left: JARVIS branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            background: 'linear-gradient(135deg, #00D4FF, #9945FF)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 800,
            color: '#000',
            fontFamily: 'Syne, sans-serif',
          }}
        >
          J
        </div>
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '16px',
            color: '#E5E7EB',
            letterSpacing: '0.05em',
          }}
        >
          JARVIS
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginLeft: '4px',
          }}
        >
          {wsConnected ? (
            <Wifi size={12} color="#00FF94" />
          ) : (
            <WifiOff size={12} color="#4B5563" />
          )}
          <span style={{ fontSize: '10px', color: wsConnected ? '#00FF94' : '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
            {wsConnected ? 'LIVE' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Center: Price ticker */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CryptoPriceBar />
      </div>

      {/* Right: Clock + settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px', justifyContent: 'flex-end' }}>
        <button
          onClick={toggleCommandPalette}
          style={{
            background: 'rgba(0,212,255,0.08)',
            border: '1px solid rgba(0,212,255,0.15)',
            borderRadius: '4px',
            color: '#4B5563',
            fontSize: '10px',
            fontFamily: 'JetBrains Mono, monospace',
            padding: '2px 6px',
            cursor: 'pointer',
          }}
        >
          ⌘K
        </button>
        <Clock />
        <Link href="/settings" style={{ color: '#4B5563', display: 'flex', alignItems: 'center' }}>
          <Settings size={16} />
        </Link>
      </div>
    </header>
  )
}
