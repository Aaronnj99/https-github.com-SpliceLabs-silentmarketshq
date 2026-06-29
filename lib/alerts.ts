import { getAlerts, triggerAlert, Alert } from './db'
import { fetchPrices } from './crypto'

export interface PriceMap {
  [symbol: string]: number
}

export interface TriggeredAlert {
  alert: Alert
  currentPrice: number
}

export async function evaluateAlerts(prices: PriceMap): Promise<TriggeredAlert[]> {
  const activeAlerts = await getAlerts(true)
  const triggered: TriggeredAlert[] = []

  for (const alert of activeAlerts) {
    const symbol = alert.coin.toUpperCase()
    const currentPrice = prices[symbol]

    if (currentPrice === undefined) continue

    const shouldTrigger =
      (alert.condition === 'above' && currentPrice >= alert.target_price) ||
      (alert.condition === 'below' && currentPrice <= alert.target_price)

    if (shouldTrigger) {
      await triggerAlert(alert.id, currentPrice)
      triggered.push({ alert, currentPrice })
    }
  }

  return triggered
}

export interface AlertSweepResult {
  checked: number
  triggered: TriggeredAlert[]
}

export async function runAlertSweep(): Promise<AlertSweepResult> {
  const activeAlerts = await getAlerts(true)
  if (activeAlerts.length === 0) {
    return { checked: 0, triggered: [] }
  }

  const coins = [...new Set(activeAlerts.map((a) => a.coin.toUpperCase()))]
  const priceData = await fetchPrices(coins)

  const prices: PriceMap = {}
  for (const coin of priceData) {
    prices[coin.symbol.toUpperCase()] = coin.current_price
  }

  const triggered = await evaluateAlerts(prices)
  return { checked: activeAlerts.length, triggered }
}

export function formatAlertMessage(alert: Alert, currentPrice: number): string {
  const direction = alert.condition === 'above' ? '▲' : '▼'
  const priceStr = currentPrice >= 1000
    ? currentPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : currentPrice.toFixed(4)
  const targetStr = alert.target_price >= 1000
    ? alert.target_price.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : alert.target_price.toFixed(4)

  return `${direction} ${alert.coin} Alert: $${priceStr} (target: $${targetStr})`
}
