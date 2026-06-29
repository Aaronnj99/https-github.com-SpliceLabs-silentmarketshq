import cron from 'node-cron'
import { runAlertSweep, formatAlertMessage } from '../lib/alerts'
import { sendAlertNotification } from '../lib/notifications'

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
    const { checked, triggered } = await runAlertSweep()
    if (checked === 0) return

    console.log(`[${new Date().toISOString()}] Checked ${checked} active alert(s)`)

    for (const { alert, currentPrice } of triggered) {
      console.log(`🔔 ${formatAlertMessage(alert, currentPrice)}`)
      sendAlertNotification(alert.coin, alert.condition, alert.target_price, currentPrice)
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
