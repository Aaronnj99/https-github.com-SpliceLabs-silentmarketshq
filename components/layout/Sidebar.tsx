'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import {
  CalendarCheck,
  LayoutDashboard,
  TrendingUp,
  FileText,
  Bell,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useJarvisStore } from '@/store/jarvis'

const NAV_ITEMS = [
  { href: '/', icon: CalendarCheck, label: 'Today' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/crypto', icon: TrendingUp, label: 'Crypto' },
  { href: '/notes', icon: FileText, label: 'Notes' },
  { href: '/alerts', icon: Bell, label: 'Alerts' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const sidebarOpen = useJarvisStore((s) => s.ui.sidebarOpen)
  const toggleSidebar = useJarvisStore((s) => s.toggleSidebar)

  // ⌘/ to toggle sidebar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  const width = sidebarOpen ? '200px' : '56px'

  return (
    <aside
      style={{
        width,
        minWidth: width,
        background: '#0D1117',
        borderRight: '1px solid rgba(0,212,255,0.15)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Nav links */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                color: isActive ? '#00D4FF' : '#4B5563',
                textDecoration: 'none',
                background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
                borderRight: isActive ? '2px solid #00D4FF' : '2px solid transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {sidebarOpen && (
                <span
                  style={{
                    fontSize: '13px',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 500,
                    opacity: sidebarOpen ? 1 : 0,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        title="⌘/"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 16px',
          background: 'transparent',
          border: 'none',
          borderTop: '1px solid rgba(0,212,255,0.1)',
          color: '#4B5563',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  )
}
