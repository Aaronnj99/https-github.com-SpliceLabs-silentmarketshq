import { CryptoChart } from '@/components/widgets/CryptoChart'
import { AlertManager } from '@/components/widgets/AlertManager'
import { CalendarWidget } from '@/components/widgets/CalendarWidget'
import { ReminderWidget } from '@/components/widgets/ReminderWidget'
import { ObsidianWidget } from '@/components/widgets/ObsidianWidget'
import { SolanaWallet } from '@/components/widgets/SolanaWallet'
import { MarketOverview } from '@/components/widgets/MarketOverview'
import { ApexBrain } from '@/components/widgets/ApexBrain'

export default function Home() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: 'auto auto auto auto auto',
      gap: '16px',
      maxWidth: '100%',
    }}>
      {/* Row 1 */}
      <div style={{ gridColumn: '1', gridRow: '1' }}>
        <MarketOverview />
      </div>
      <div style={{ gridColumn: '2', gridRow: '1' }}>
        <CalendarWidget />
      </div>

      {/* Row 2 */}
      <div style={{ gridColumn: '1', gridRow: '2' }}>
        <CryptoChart />
      </div>
      <div style={{ gridColumn: '2', gridRow: '2' }}>
        <ReminderWidget />
      </div>

      {/* Row 3 */}
      <div style={{ gridColumn: '1', gridRow: '3' }}>
        <AlertManager />
      </div>
      <div style={{ gridColumn: '2', gridRow: '3' }}>
        <ObsidianWidget />
      </div>

      {/* Row 4 - full width */}
      <div style={{ gridColumn: '1 / -1', gridRow: '4' }}>
        <SolanaWallet />
      </div>

      {/* Row 5 - APEX AI brain, full width */}
      <div style={{ gridColumn: '1 / -1', gridRow: '5' }}>
        <ApexBrain />
      </div>
    </div>
  )
}
