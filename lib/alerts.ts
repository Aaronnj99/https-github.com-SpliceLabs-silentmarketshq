import { getAlerts, triggerAlert, Alert } from './db'

export interface PriceMap {
  [symbol: string]: number
}

export interface TriggeredAlert {
  alert: Alert
  currentPrice: number
}

export function evaluateAlerts(prices: PriceMap): TriggeredAlert[] {
  const activeAlerts = getAlerts(true)
  const triggered: TriggeredAlert[] = []

  for (const alert of activeAlerts) {
    const symbol = alert.coin.toUpperCase()
    const currentPrice = prices[symbol]

    if (currentPrice === undefined) continue

    const shouldTrigger =
      (alert.condition === 'above' && currentPrice >= alert.target_price) ||
      (alert.condition === 'below' && currentPrice <= alert.target_price)

    if (shouldTrigger) {
      triggerAlert(alert.id, currentPrice)
      triggered.push({ alert, currentPrice })
    }
  }

  return triggered
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
