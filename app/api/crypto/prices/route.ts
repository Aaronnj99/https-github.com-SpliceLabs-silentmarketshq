import { NextRequest, NextResponse } from 'next/server'
import { fetchPrices, fetchMarketOverview } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coinsParam = searchParams.get('coins') ?? process.env.NEXT_PUBLIC_DEFAULT_COINS ?? 'BTC,SOL,ETH'
    const includeOverview = searchParams.get('overview') === '1'

    const coinSymbols = coinsParam.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean)

    const [prices, overview] = await Promise.allSettled([
      fetchPrices(coinSymbols),
      includeOverview ? fetchMarketOverview() : Promise.resolve(null),
    ])

    const priceData = prices.status === 'fulfilled' ? prices.value : []
    const overviewData = overview.status === 'fulfilled' ? overview.value : null

    if (includeOverview) {
      return NextResponse.json({ prices: priceData, overview: overviewData })
    }

    return NextResponse.json(priceData)
  } catch (error) {
    console.error('Prices API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}
