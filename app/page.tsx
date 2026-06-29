import { CryptoChart } from '@/components/widgets/CryptoChart'
import { AlertManager } from '@/components/widgets/AlertManager'
import { CalendarWidget } from '@/components/widgets/CalendarWidget'
import { ReminderWidget } from '@/components/widgets/ReminderWidget'
import { ObsidianWidget } from '@/components/widgets/ObsidianWidget'
import { SolanaWallet } from '@/components/widgets/SolanaWallet'
import { MarketOverview } from '@/components/widgets/MarketOverview'
import { ApexBrain } from '@/components/widgets/ApexBrain'
import { AgentOps } from '@/components/widgets/AgentOps'

export default function Home() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: 'auto auto auto auto auto auto',
      gap: '16px',
      maxWidth: '100%',
    }}>
      {/* Row 1 - Agent Ops mission control, full width */}
      <div style={{ gridColumn: '1 / -1', gridRow: '1' }}>
        <AgentOps />
      </div>

      {/* Row 2 */}
      <div style={{ gridColumn: '1', gridRow: '2' }}>
        <MarketOverview />
      </div>
      <div style={{ gridColumn: '2', gridRow: '2' }}>
        <CalendarWidget />
      </div>

      {/* Row 3 */}
      <div style={{ gridColumn: '1', gridRow: '3' }}>
        <CryptoChart />
      </div>
      <div style={{ gridColumn: '2', gridRow: '3' }}>
        <ReminderWidget />
      </div>

      {/* Row 4 */}
      <div style={{ gridColumn: '1', gridRow: '4' }}>
        <AlertManager />
      </div>
      <div style={{ gridColumn: '2', gridRow: '4' }}>
        <ObsidianWidget />
      </div>

      {/* Row 5 - full width */}
      <div style={{ gridColumn: '1 / -1', gridRow: '5' }}>
        <SolanaWallet />
      </div>

      {/* Row 6 - APEX AI chat, full width */}
      <div style={{ gridColumn: '1 / -1', gridRow: '6' }}>
        <ApexBrain />
      </div>
    </div>
  )
}
