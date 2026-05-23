import { NextRequest, NextResponse } from 'next/server'
import { getRecentTransactions } from '@/lib/solana'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const walletAddress = process.env.SOLANA_WALLET_ADDRESS

  if (!walletAddress) {
    return NextResponse.json({ configured: false, transactions: [] })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

    const transactions = await getRecentTransactions(walletAddress, limit)
    return NextResponse.json({ configured: true, transactions })
  } catch (error) {
    console.error('Solana transactions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
