import { getAllSettings } from '../lib/db'

async function main() {
  // Importing lib/db triggers schema creation on first query.
  await getAllSettings()
  const target = process.env.TURSO_DATABASE_URL ? 'Turso (remote)' : 'data/apex.db (local file)'
  console.log('✅ Database initialized:', target)
  console.log('📊 Tables ready: alerts, reminders, settings, alert_history, agent_jobs')
}

main().catch((err) => {
  console.error('Database init failed:', err)
  process.exit(1)
})
