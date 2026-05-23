import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ApexContext {
  prices?: Record<string, { price: number; change24h: number }>
  alerts?: Array<{ coin: string; condition: string; target_price: number; active: boolean }>
  reminders?: Array<{ title: string; due_at: string | null; priority: string; completed: boolean }>
  fearGreed?: { value: number; classification: string }
  walletAddress?: string
}

export async function chatWithApex(
  messages: Message[],
  context: ApexContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context)

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  })

  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}

export async function analyzePortfolio(context: ApexContext): Promise<string> {
  const systemPrompt = buildSystemPrompt(context)

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content:
          'Give me a concise 3-bullet market briefing based on the current data. Focus on actionable insights. Be direct.',
      },
    ],
  })

  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}

function buildSystemPrompt(context: ApexContext): string {
  const lines: string[] = [
    'You are APEX — an elite personal trading and productivity AI assistant. You are embedded in a Bloomberg-style personal command center.',
    'You have access to live market data, alerts, reminders, and wallet info.',
    'Be direct, precise, and data-driven. Think like a hedge fund analyst. No fluff.',
    '',
    '## Live Context',
  ]

  if (context.prices && Object.keys(context.prices).length > 0) {
    lines.push('### Current Prices')
    for (const [symbol, data] of Object.entries(context.prices)) {
      const dir = data.change24h >= 0 ? '▲' : '▼'
      lines.push(
        `- ${symbol}: $${data.price.toLocaleString()} ${dir}${Math.abs(data.change24h).toFixed(2)}%`
      )
    }
  }

  if (context.fearGreed) {
    lines.push(
      `### Market Sentiment\n- Fear & Greed: ${context.fearGreed.value}/100 (${context.fearGreed.classification})`
    )
  }

  if (context.alerts && context.alerts.length > 0) {
    const active = context.alerts.filter((a) => a.active)
    if (active.length > 0) {
      lines.push('### Active Alerts')
      active.forEach((a) => {
        lines.push(`- ${a.coin} ${a.condition} $${a.target_price.toLocaleString()}`)
      })
    }
  }

  if (context.reminders && context.reminders.length > 0) {
    const pending = context.reminders.filter((r) => !r.completed)
    if (pending.length > 0) {
      lines.push('### Pending Reminders')
      pending.slice(0, 5).forEach((r) => {
        lines.push(`- ${r.title}${r.due_at ? ` (due ${r.due_at})` : ''}`)
      })
    }
  }

  if (context.walletAddress) {
    lines.push(`### Solana Wallet\n- Address: ${context.walletAddress}`)
  }

  return lines.join('\n')
}
