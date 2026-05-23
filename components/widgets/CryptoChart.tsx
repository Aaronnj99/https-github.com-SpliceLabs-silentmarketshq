'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Maximize2, X, TrendingUp, TrendingDown } from 'lucide-react'
import { useJarvisStore } from '@/store/jarvis'
import { formatPrice, formatMarketCap } from '@/lib/crypto'

interface OHLCVPoint {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}

interface ChartData {
  time: string
  price: number
  timestamp: number
}

const TIMEFRAMES = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
]

function formatTimestamp(ts: number, days: number): string {
  const date = new Date(ts)
  if (days <= 1) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (days <= 30) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#0D1117',
        border: '1px solid rgba(0,212,255,0.3)',
        borderRadius: '6px',
        padding: '8px 12px',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      <div style={{ fontSize: '11px', color: '#4B5563', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#00D4FF' }}>
        ${formatPrice(payload[0].value)}
      </div>
    </div>
  )
}

interface ChartViewProps {
  coin: string
  days: number
  isModal?: boolean
}

function ChartView({ coin, days, isModal = false }: ChartViewProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const prices = useJarvisStore((s) => s.prices)
  const currentPrice = prices[coin]?.price ?? 0
  const change = prices[coin]?.priceChangePercent ?? 0

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/crypto/history?coin=${coin}&days=${days}`)
      if (!res.ok) throw new Error('Failed to fetch chart data')
      const ohlcv: OHLCVPoint[] = await res.json() as OHLCVPoint[]
      setData(
        ohlcv.map((point) => ({
          time: formatTimestamp(point.timestamp, days),
          price: point.close,
          timestamp: point.timestamp,
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading chart')
    } finally {
      setLoading(false)
    }
  }, [coin, days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isPositive = change >= 0
  const priceColor = isPositive ? '#00FF94' : '#FF4444'
  const chartColor = isPositive ? '#00FF94' : '#FF4444'
  const chartHeight = isModal ? 300 : 180

  if (loading) {
    return (
      <div style={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '4px' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
        {error}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#E5E7EB', fontFamily: 'JetBrains Mono, monospace' }}>
            ${formatPrice(currentPrice)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            {isPositive ? <TrendingUp size={12} color={priceColor} /> : <TrendingDown size={12} color={priceColor} />}
            <span style={{ fontSize: '13px', color: priceColor, fontFamily: 'JetBrains Mono, monospace' }}>
              {isPositive ? '+' : ''}{change.toFixed(2)}% (24h)
            </span>
          </div>
        </div>
        {prices[coin]?.marketCap && (
          <div style={{ textAlign: 'right', fontSize: '11px', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
            <div>MCap: {formatMarketCap(prices[coin].marketCap!)}</div>
            <div>Vol: {formatMarketCap(prices[coin].volume ?? 0)}</div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${coin}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${formatPrice(v)}`}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke={chartColor}
            strokeWidth={2}
            fill={`url(#gradient-${coin})`}
            dot={false}
            activeDot={{ r: 4, fill: chartColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CryptoChart() {
  const selectedCoin = useJarvisStore((s) => s.ui.selectedCoin)
  const setSelectedCoin = useJarvisStore((s) => s.setSelectedCoin)
  const chartModalOpen = useJarvisStore((s) => s.ui.chartModalOpen)
  const setChartModalOpen = useJarvisStore((s) => s.setChartModalOpen)
  const [days, setDays] = useState(7)
  const [modalDays, setModalDays] = useState(30)

  const COINS = ['BTC', 'SOL', 'ETH', 'AVAX', 'LINK']

  return (
    <>
      <div className="card" style={{ padding: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {COINS.map((coin) => (
              <button
                key={coin}
                onClick={() => setSelectedCoin(coin)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: selectedCoin === coin ? '1px solid rgba(0,212,255,0.5)' : '1px solid transparent',
                  background: selectedCoin === coin ? 'rgba(0,212,255,0.1)' : 'transparent',
                  color: selectedCoin === coin ? '#00D4FF' : '#4B5563',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {coin}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {TIMEFRAMES.slice(0, 3).map((tf) => (
              <button
                key={tf.label}
                onClick={() => setDays(tf.days)}
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: 'none',
                  background: days === tf.days ? 'rgba(0,212,255,0.15)' : 'transparent',
                  color: days === tf.days ? '#00D4FF' : '#4B5563',
                  fontSize: '10px',
                  fontFamily: 'JetBrains Mono, monospace',
                  cursor: 'pointer',
                }}
              >
                {tf.label}
              </button>
            ))}
            <button
              onClick={() => setChartModalOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', marginLeft: '4px' }}
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        <ChartView coin={selectedCoin} days={days} />
      </div>

      {/* Modal */}
      {chartModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 500,
            background: 'rgba(8,10,15,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setChartModalOpen(false)
          }}
        >
          <div
            style={{
              background: '#0D1117',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '800px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '18px', color: '#E5E7EB' }}>
                  {selectedCoin} / USD
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.label}
                      onClick={() => setModalDays(tf.days)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: modalDays === tf.days ? 'rgba(0,212,255,0.15)' : 'transparent',
                        color: modalDays === tf.days ? '#00D4FF' : '#4B5563',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono, monospace',
                        cursor: 'pointer',
                      }}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setChartModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}
              >
                <X size={18} />
              </button>
            </div>
            <ChartView coin={selectedCoin} days={modalDays} isModal />
          </div>
        </div>
      )}
    </>
  )
}
