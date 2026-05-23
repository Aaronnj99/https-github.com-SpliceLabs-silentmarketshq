import { NextRequest, NextResponse } from 'next/server'
import { analyzePortfolio, type ApexContext } from '@/lib/apex-ai'

export async function POST(req: NextRequest) {
  try {
    const context: ApexContext = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 503 }
      )
    }

    const brief = await analyzePortfolio(context)
    return NextResponse.json({ brief })
  } catch (err) {
    console.error('[AI brief error]', err)
    return NextResponse.json({ error: 'AI brief failed' }, { status: 500 })
  }
}
