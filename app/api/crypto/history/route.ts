import { NextRequest, NextResponse } from 'next/server'
import { fetchOHLCV } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coin = searchParams.get('coin') ?? 'BTC'
    const days = parseInt(searchParams.get('days') ?? '7', 10)

    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json({ error: 'days must be 1-365' }, { status: 400 })
    }

    const data = await fetchOHLCV(coin, days)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${days <= 7 ? 300 : 3600}`,
      },
    })
  } catch (error) {
    console.error('History API error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
