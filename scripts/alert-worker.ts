import cron from 'node-cron'
import axios from 'axios'
import { getAlerts, triggerAlert, Alert, getDueUnnotifiedReminders, markReminderNotified } from '../lib/db'
import { sendAlertNotification, sendReminderNotification } from '../lib/notifications'
import { sendDailyDigest } from '../lib/daily-digest'
import { fetchPrices, getCoinGeckoId } from '../lib/crypto'

// Load environment variables if dotenv is available
try {
  require('dotenv').config({ path: '.env.local' })
} catch {
  // dotenv not installed, assume env is set
}

console.log('🤖 JARVIS Worker starting...')
console.log('📅 Checking prices and reminders every 60 seconds')

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

async function checkReminders() {
  try {
    const due = getDueUnnotifiedReminders()
    for (const reminder of due) {
      console.log(`⏰ Reminder due: ${reminder.title}`)
      sendReminderNotification(reminder.title, reminder.description ?? undefined)
      markReminderNotified(reminder.id)
    }
  } catch (err) {
    console.error('Reminder check error:', err)
  }
}

// Run immediately on start
checkAlerts()
checkReminders()

// Schedule every 60 seconds
cron.schedule('* * * * *', checkAlerts)
cron.schedule('* * * * *', checkReminders)

// Daily digest — sent via Telegram at DAILY_DIGEST_TIME (HH:MM, default 07:00)
const digestTime = process.env.DAILY_DIGEST_TIME ?? '07:00'
const [digestHour, digestMinute] = digestTime.split(':').map((n) => parseInt(n, 10))
if (!isNaN(digestHour) && !isNaN(digestMinute)) {
  cron.schedule(`${digestMinute} ${digestHour} * * *`, () => {
    console.log('📋 Sending daily digest...')
    sendDailyDigest().catch((err) => console.error('Daily digest failed:', err))
  })
  console.log(`📋 Daily digest scheduled for ${digestTime}`)
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 JARVIS Worker stopping...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 JARVIS Worker stopping...')
  process.exit(0)
})
