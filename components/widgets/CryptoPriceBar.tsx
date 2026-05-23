'use client'
import { useRef, useEffect, useState } from 'react'
import { useCryptoPrices } from '@/hooks/useCryptoPrices'
import { formatPrice } from '@/lib/crypto'

const COINS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'AVAX', 'LINK', 'DOT']

interface PricePill {
  symbol: string
  price: number
  change: number
  animated: boolean
}

export function CryptoPriceBar() {
  const { prices } = useCryptoPrices(COINS)
  const prevPricesRef = useRef<Record<string, number>>({})
  const [animated, setAnimated] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const newAnimated: Record<string, boolean> = {}
    for (const symbol of COINS) {
      const current = prices[symbol]?.price
      const prev = prevPricesRef.current[symbol]
      if (current !== undefined && prev !== undefined && current !== prev) {
        newAnimated[symbol] = true
      }
      if (current !== undefined) {
        prevPricesRef.current[symbol] = current
      }
    }

    if (Object.keys(newAnimated).length > 0) {
      setAnimated(newAnimated)
      setTimeout(() => setAnimated({}), 500)
    }
  }, [prices])

  const pills: PricePill[] = COINS.map((symbol) => ({
    symbol,
    price: prices[symbol]?.price ?? 0,
    change: prices[symbol]?.priceChangePercent ?? 0,
    animated: animated[symbol] ?? false,
  })).filter((p) => p.price > 0)

  if (pills.length === 0) {
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflow: 'hidden' }}>
        {COINS.slice(0, 5).map((symbol) => (
          <div
            key={symbol}
            className="skeleton"
            style={{ width: '100px', height: '22px', borderRadius: '4px', flexShrink: 0 }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {pills.map(({ symbol, price, change, animated: anim }) => {
        const isPositive = change >= 0
        const color = isPositive ? '#00FF94' : '#FF4444'
        return (
          <div
            key={symbol}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '4px',
              flexShrink: 0,
              animation: anim ? 'tickUp 0.3s ease-out' : 'none',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: symbol === 'BTC' ? '#FFB800' : symbol === 'SOL' ? '#9945FF' : '#00D4FF',
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.05em',
              }}
            >
              {symbol}
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#E5E7EB',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              ${formatPrice(price)}
            </span>
            <span
              style={{
                fontSize: '10px',
                color,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
