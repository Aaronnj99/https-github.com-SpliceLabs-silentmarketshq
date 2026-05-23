'use client'
import useSWR from 'swr'
import { TrendingUp, BarChart2, Activity } from 'lucide-react'

interface MarketData {
  total_market_cap: number
  btc_dominance: number
  fear_greed_index: number
  fear_greed_label: string
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json() as Promise<MarketData>
  })

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return `$${value.toLocaleString()}`
}

function getFGColor(index: number): string {
  if (index <= 24) return '#FF4444'       // Extreme Fear
  if (index <= 44) return '#FFB800'       // Fear
  if (index <= 54) return '#9CA3AF'       // Neutral
  if (index <= 74) return '#00FF94'       // Greed
  return '#00D4FF'                         // Extreme Greed
}

function FearGreedGauge({ value, label }: { value: number; label: string }) {
  const color = getFGColor(value)
  const angle = (value / 100) * 180 - 90  // -90 to 90 degrees
  const radius = 40
  const cx = 50
  const cy = 50

  // Arc path
  const startAngle = -Math.PI  // 180 deg (left)
  const endAngle = 0           // 0 deg (right)
  const arcX1 = cx + radius * Math.cos(startAngle)
  const arcY1 = cy + radius * Math.sin(startAngle)
  const arcX2 = cx + radius * Math.cos(endAngle)
  const arcY2 = cy + radius * Math.sin(endAngle)

  // Value arc
  const valueAngle = -Math.PI + (value / 100) * Math.PI
  const valueX = cx + radius * Math.cos(valueAngle)
  const valueY = cy + radius * Math.sin(valueAngle)

  // Needle
  const needleAngle = ((angle) * Math.PI) / 180
  const needleX = cx + 35 * Math.cos(needleAngle)
  const needleY = cy + 35 * Math.sin(needleAngle)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg viewBox="0 0 100 55" style={{ width: '120px', height: '66px' }}>
        {/* Background arc */}
        <path
          d={`M ${arcX1} ${arcY1} A ${radius} ${radius} 0 0 1 ${arcX2} ${arcY2}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${arcX1} ${arcY1} A ${radius} ${radius} 0 0 1 ${valueX} ${valueY}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={3} fill={color} />

        {/* Labels */}
        <text x="10" y="53" fontSize="6" fill="#4B5563" fontFamily="monospace">Fear</text>
        <text x="74" y="53" fontSize="6" fill="#4B5563" fontFamily="monospace">Greed</text>
      </svg>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '24px', fontWeight: 700, color, lineHeight: 1, marginTop: '4px' }}>
        {value}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#4B5563', marginTop: '2px' }}>
        {label}
      </div>
    </div>
  )
}

export function MarketOverview() {
  const { data, isLoading } = useSWR<MarketData>(
    '/api/crypto/prices?overview=1',
    async (url: string) => {
      const r = await fetch('/api/crypto/prices?overview=1')
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const json = await r.json() as { overview?: MarketData }
      return json.overview ?? { total_market_cap: 0, btc_dominance: 0, fear_greed_index: 50, fear_greed_label: 'Neutral' }
    },
    { refreshInterval: 5 * 60 * 1000 }
  )

  return (
    <div className="card" style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Activity size={16} color="#00D4FF" />
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '14px', color: '#E5E7EB' }}>
          Market Overview
        </span>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '6px' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'start' }}>
          {/* Fear & Greed */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', alignSelf: 'flex-start' }}>
              Fear &amp; Greed
            </div>
            <FearGreedGauge
              value={data?.fear_greed_index ?? 50}
              label={data?.fear_greed_label ?? 'Neutral'}
            />
          </div>

          {/* Total Market Cap */}
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <BarChart2 size={12} color="#00D4FF" />
              <span style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Market Cap
              </span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#00D4FF', fontFamily: 'JetBrains Mono, monospace' }}>
              {formatMarketCap(data?.total_market_cap ?? 0)}
            </div>
            <div style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
              Total crypto market
            </div>
          </div>

          {/* BTC Dominance */}
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <TrendingUp size={12} color="#FFB800" />
              <span style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                BTC Dom.
              </span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#FFB800', fontFamily: 'JetBrains Mono, monospace' }}>
              {(data?.btc_dominance ?? 0).toFixed(1)}%
            </div>
            {/* Dominance bar */}
            <div style={{ marginTop: '8px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${data?.btc_dominance ?? 0}%`,
                  background: '#FFB800',
                  borderRadius: '2px',
                  transition: 'width 0.5s ease',
                  boxShadow: '0 0 6px rgba(255,184,0,0.5)',
                }}
              />
            </div>
            <div style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
              of total market
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
