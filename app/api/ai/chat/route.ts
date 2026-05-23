import { NextRequest, NextResponse } from 'next/server'
import { chatWithApex, type Message, type ApexContext } from '@/lib/apex-ai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, context }: { messages: Message[]; context: ApexContext } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 503 }
      )
    }

    const reply = await chatWithApex(messages, context ?? {})
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[AI chat error]', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
