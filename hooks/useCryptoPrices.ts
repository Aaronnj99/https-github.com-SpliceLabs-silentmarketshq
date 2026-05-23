'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useJarvisStore } from '@/store/jarvis'
import { getBinanceStreamUrl, parseBinanceMessage } from '@/lib/crypto'

const DEFAULT_COINS = (
  process.env.NEXT_PUBLIC_DEFAULT_COINS ?? 'BTC,SOL,ETH'
).split(',')

export function useCryptoPrices(coins: string[] = DEFAULT_COINS) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const updatePrice = useJarvisStore((s) => s.updatePrice)
  const setWsConnected = useJarvisStore((s) => s.setWsConnected)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const url = getBinanceStreamUrl(coins)
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setWsConnected(true)
      reconnectAttemptsRef.current = 0
    }

    ws.onmessage = (event: MessageEvent<string>) => {
      const ticker = parseBinanceMessage(event.data)
      if (!ticker) return

      updatePrice(ticker.symbol, {
        price: parseFloat(ticker.price),
        priceChangePercent: parseFloat(ticker.priceChangePercent),
        lastUpdated: new Date().toISOString(),
      })
    }

    ws.onclose = () => {
      setWsConnected(false)
      wsRef.current = null

      // Exponential backoff reconnect
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
      reconnectAttemptsRef.current++
      reconnectTimeoutRef.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [coins, updatePrice, setWsConnected])

  // Also fetch initial prices from REST API
  const fetchInitialPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/crypto/prices')
      if (!res.ok) return
      const data = (await res.json()) as Array<{
        symbol: string
        current_price: number
        price_change_percentage_24h: number
        high_24h: number
        low_24h: number
        market_cap: number
        total_volume: number
        last_updated: string
      }>
      for (const coin of data) {
        updatePrice(coin.symbol, {
          price: coin.current_price,
          priceChangePercent: coin.price_change_percentage_24h,
          high24h: coin.high_24h,
          low24h: coin.low_24h,
          marketCap: coin.market_cap,
          volume: coin.total_volume,
          lastUpdated: coin.last_updated,
        })
      }
    } catch {
      // Silently fail - WebSocket will provide data
    }
  }, [updatePrice])

  useEffect(() => {
    fetchInitialPrices()
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.onclose = null // Prevent reconnect on unmount
        wsRef.current.close()
      }
      setWsConnected(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    isConnected: useJarvisStore((s) => s.wsConnected),
    prices: useJarvisStore((s) => s.prices),
  }
}
