import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { CommandPalette } from '@/components/layout/CommandPalette'

export const metadata: Metadata = {
  title: 'APEX — Personal Command Center',
  description: 'Your personal Bloomberg Terminal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <TopBar />
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <Sidebar />
            <main style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              {children}
            </main>
          </div>
        </div>
        <CommandPalette />
      </body>
    </html>
  )
}
