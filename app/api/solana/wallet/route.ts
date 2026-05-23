import { NextResponse } from 'next/server'
import { getSolBalance, getSPLTokens } from '@/lib/solana'
import { fetchPrices } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

export async function GET() {
  const walletAddress = process.env.SOLANA_WALLET_ADDRESS

  if (!walletAddress) {
    return NextResponse.json({
      configured: false,
      address: null,
      sol: 0,
      solUsd: 0,
      tokens: [],
    })
  }

  try {
    const [balanceResult, tokensResult, solPriceResult] = await Promise.allSettled([
      getSolBalance(walletAddress),
      getSPLTokens(walletAddress),
      fetchPrices(['SOL']),
    ])

    const balance = balanceResult.status === 'fulfilled' ? balanceResult.value : { sol: 0, lamports: 0 }
    const tokens = tokensResult.status === 'fulfilled' ? tokensResult.value : []
    const solPrice =
      solPriceResult.status === 'fulfilled' && solPriceResult.value.length > 0
        ? solPriceResult.value[0].current_price
        : 0

    return NextResponse.json({
      configured: true,
      address: walletAddress,
      sol: balance.sol,
      solUsd: balance.sol * solPrice,
      tokens: tokens.map((t) => ({
        mint: t.mint,
        symbol: t.symbol,
        name: t.name,
        uiAmount: t.uiAmount,
        logoUri: t.logoUri,
      })),
    })
  } catch (error) {
    console.error('Solana wallet error:', error)
    return NextResponse.json(
      {
        configured: true,
        address: walletAddress,
        sol: 0,
        solUsd: 0,
        tokens: [],
        error: error instanceof Error ? error.message : 'Failed to fetch wallet data',
      },
      { status: 500 }
    )
  }
}
