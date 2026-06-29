import Anthropic from '@anthropic-ai/sdk'
import { fetchPrices, fetchMarketOverview, formatPrice } from './crypto'
import { getAlerts, getReminders, createJobRun, completeJobRun, failJobRun, type AgentJobRun } from './db'
import { getSolBalance } from './solana'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const TRACKED_COINS = (process.env.NEXT_PUBLIC_DEFAULT_COINS ?? 'BTC,SOL,ETH')
  .split(',')
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean)

async function complete(system: string, user: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }
  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 500,
    system,
    messages: [{ role: 'user', content: user }],
  })
  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}

async function runMarketScanner(): Promise<string> {
  const prices = await fetchPrices(TRACKED_COINS)
  const lines = prices.map(
    (p) =>
      `${p.symbol}: $${formatPrice(p.current_price)} (${p.price_change_percentage_24h >= 0 ? '+' : ''}${p.price_change_percentage_24h.toFixed(2)}% 24h, vol $${(p.total_volume / 1e6).toFixed(1)}M, range $${formatPrice(p.low_24h)}-$${formatPrice(p.high_24h)})`
  )

  return complete(
    'You are the APEX Market Scanner — an autonomous agent that flags notable price action across tracked assets. Output max 4 short bullet points. No fluff, no disclaimers, no "I notice that". Be a terse trading desk analyst.',
    `Live data:\n${lines.join('\n')}\n\nFlag any notable moves, momentum shifts, or levels worth watching right now.`
  )
}

async function runPortfolioRisk(): Promise<string> {
  const alerts = await getAlerts(true)
  const alertLines = alerts.length
    ? alerts.map((a) => `${a.coin} ${a.condition} $${a.target_price.toLocaleString()}`).join('\n')
    : 'No active alerts.'

  let walletLine = 'No wallet configured.'
  const walletAddress = process.env.SOLANA_WALLET_ADDRESS
  if (walletAddress) {
    try {
      const balance = await getSolBalance(walletAddress)
      walletLine = `SOL balance: ${balance.sol.toFixed(2)} SOL`
    } catch {
      walletLine = 'Wallet configured but RPC fetch failed.'
    }
  }

  return complete(
    'You are the APEX Portfolio Risk Analyst — an autonomous agent assessing concentration risk and alert proximity to current price. Output max 4 short bullet points. Be direct like a risk desk.',
    `Active alerts:\n${alertLines}\n\nWallet:\n${walletLine}\n\nFlag any concentration risk, alerts close to triggering, or exposure worth reviewing.`
  )
}

async function runNewsDigest(): Promise<string> {
  const overview = await fetchMarketOverview()

  return complete(
    'You are the APEX News/Sentiment Digest — an autonomous agent summarizing macro crypto sentiment. Output max 3 short bullet points. Terse, no fluff.',
    `Fear & Greed Index: ${overview.fear_greed_index}/100 (${overview.fear_greed_label})\nBTC Dominance: ${overview.btc_dominance.toFixed(1)}%\nTotal Market Cap: $${(overview.total_market_cap / 1e9).toFixed(1)}B\n\nSummarize what current sentiment implies for positioning.`
  )
}

async function runDailyBriefing(): Promise<string> {
  const prices = await fetchPrices(TRACKED_COINS)
  const reminders = (await getReminders(false)).slice(0, 5)
  const alerts = await getAlerts(true)

  const priceLine = prices.map((p) => `${p.symbol} $${formatPrice(p.current_price)}`).join(', ')
  const reminderLines = reminders.length
    ? reminders.map((r) => `- ${r.title}`).join('\n')
    : 'None pending.'

  return complete(
    'You are APEX Daily Ops — an autonomous agent producing a morning briefing that combines markets, reminders, and priorities. Output max 5 short bullet points. Direct, no cheesy motivational fluff.',
    `Prices: ${priceLine}\nActive alerts: ${alerts.length}\nPending reminders:\n${reminderLines}\n\nWrite today's ops briefing.`
  )
}

export interface AgentJobSpec {
  key: string
  name: string
  cron: string
  description: string
  run: () => Promise<string>
}

export const AGENT_JOBS: AgentJobSpec[] = [
  {
    key: 'market_scanner',
    name: 'Market Scanner',
    cron: '*/5 * * * *',
    description: 'Scans tracked coins for notable price action every 5 min',
    run: runMarketScanner,
  },
  {
    key: 'portfolio_risk',
    name: 'Portfolio Risk Analyst',
    cron: '*/15 * * * *',
    description: 'Reviews alerts and wallet exposure every 15 min',
    run: runPortfolioRisk,
  },
  {
    key: 'news_digest',
    name: 'News/Sentiment Digest',
    cron: '*/15 * * * *',
    description: 'Summarizes Fear & Greed and dominance shifts every 15 min',
    run: runNewsDigest,
  },
  {
    key: 'daily_briefing',
    name: 'Daily Ops Briefing',
    cron: '0 8 * * *',
    description: 'Combines markets, alerts, and reminders into one daily summary at 8am',
    run: runDailyBriefing,
  },
]

export async function executeJob(spec: AgentJobSpec): Promise<AgentJobRun> {
  const jobRow = await createJobRun(spec.key, spec.name)
  try {
    const output = await spec.run()
    await completeJobRun(jobRow.id, output)
    return { ...jobRow, status: 'complete', output }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await failJobRun(jobRow.id, message)
    return { ...jobRow, status: 'error', error: message }
  }
}

export async function executeJobByKey(key: string): Promise<AgentJobRun> {
  const spec = AGENT_JOBS.find((j) => j.key === key)
  if (!spec) throw new Error(`Unknown job: ${key}`)
  return executeJob(spec)
}
