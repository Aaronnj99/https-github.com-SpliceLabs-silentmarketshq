import cron from 'node-cron'

try {
  require('dotenv').config({ path: '.env.local' })
} catch {
  // dotenv not installed, assume env is set
}

import { AGENT_JOBS, executeJob } from '../lib/agent-jobs'

console.log('🛰️  APEX Agent Ops worker starting...')

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  ANTHROPIC_API_KEY not set — jobs will fail until it is configured in .env.local')
}

const running = new Set<string>()

async function runJob(key: string) {
  if (running.has(key)) return
  const spec = AGENT_JOBS.find((j) => j.key === key)
  if (!spec) return

  running.add(key)
  console.log(`[${new Date().toISOString()}] ▶ ${spec.name} starting`)
  try {
    const run = await executeJob(spec)
    if (run.status === 'complete') {
      console.log(`[${new Date().toISOString()}] ✅ ${spec.name} complete`)
    } else {
      console.error(`[${new Date().toISOString()}] ❌ ${spec.name} failed: ${run.error}`)
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ ${spec.name} crashed:`, err)
  } finally {
    running.delete(key)
  }
}

// Run every job once on startup
for (const spec of AGENT_JOBS) {
  runJob(spec.key)
}

// Schedule each job on its own cron interval
for (const spec of AGENT_JOBS) {
  cron.schedule(spec.cron, () => runJob(spec.key))
  console.log(`📅 Scheduled ${spec.name} — ${spec.cron}`)
}

process.on('SIGINT', () => {
  console.log('\n🛑 Agent Ops worker stopping...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Agent Ops worker stopping...')
  process.exit(0)
})
