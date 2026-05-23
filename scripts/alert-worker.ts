import cron from 'node-cron'
import axios from 'axios'
import { getAlerts, triggerAlert, Alert } from '../lib/db'
import { sendAlertNotification } from '../lib/notifications'
import { fetchPrices, getCoinGeckoId } from '../lib/crypto'

// Load environment variables if dotenv is available
try {
  require('dotenv').config({ path: '.env.local' })
} catch {
  // dotenv not installed, assume env is set
}

console.log('🤖 APEX Alert Worker starting...')
console.log('📅 Checking prices every 60 seconds')

let isChecking = false

async function checkAlerts() {
  if (isChecking) return
  isChecking = true

  try {
    const activeAlerts = getAlerts(true)
    if (activeAlerts.length === 0) {
      isChecking = false
      return
    }

    // Get unique coins from active alerts
    const coins = [...new Set(activeAlerts.map((a) => a.coin.toUpperCase()))]
    console.log(`[${new Date().toISOString()}] Checking ${activeAlerts.length} alerts for ${coins.join(', ')}`)

    let prices: Record<string, number> = {}

    try {
      const priceData = await fetchPrices(coins)
      for (const coin of priceData) {
        prices[coin.symbol.toUpperCase()] = coin.current_price
      }
    } catch (err) {
      console.error('Failed to fetch prices from CoinGecko:', err)
      isChecking = false
      return
    }

    const triggered: Alert[] = []

    for (const alert of activeAlerts) {
      const symbol = alert.coin.toUpperCase()
      const currentPrice = prices[symbol]

      if (currentPrice === undefined) {
        console.warn(`No price for ${symbol}`)
        continue
      }

      const shouldTrigger =
        (alert.condition === 'above' && currentPrice >= alert.target_price) ||
        (alert.condition === 'below' && currentPrice <= alert.target_price)

      if (shouldTrigger) {
        console.log(
          `🔔 Alert triggered! ${symbol} ${alert.condition} $${alert.target_price} — current: $${currentPrice}`
        )
        triggerAlert(alert.id, currentPrice)
        sendAlertNotification(symbol, alert.condition, alert.target_price, currentPrice)
        triggered.push(alert)
      }
    }

    if (triggered.length === 0) {
      console.log(`[${new Date().toISOString()}] No alerts triggered`)
    } else {
      console.log(`[${new Date().toISOString()}] ${triggered.length} alert(s) triggered`)
    }
  } catch (err) {
    console.error('Alert check error:', err)
  } finally {
    isChecking = false
  }
}

// Run immediately on start
checkAlerts()

// Schedule every 60 seconds
cron.schedule('* * * * *', checkAlerts)

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Alert worker stopping...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Alert worker stopping...')
  process.exit(0)
})
