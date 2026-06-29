import { NextRequest, NextResponse } from 'next/server'
import { getRecentJobRuns, getLatestJobRunPerKey } from '@/lib/db'
import { AGENT_JOBS, executeJobByKey } from '@/lib/agent-jobs'

export async function GET() {
  const latest = getLatestJobRunPerKey()
  const history = getRecentJobRuns(30)

  const stations = AGENT_JOBS.map((spec) => ({
    key: spec.key,
    name: spec.name,
    description: spec.description,
    cron: spec.cron,
    latestRun: latest.find((r) => r.job_key === spec.key) ?? null,
  }))

  return NextResponse.json({ stations, history })
}

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json()

    if (!key || !AGENT_JOBS.some((j) => j.key === key)) {
      return NextResponse.json({ error: 'Unknown job key' }, { status: 400 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
    }

    const run = await executeJobByKey(key)
    return NextResponse.json({ run })
  } catch (err) {
    console.error('[jobs trigger]', err)
    return NextResponse.json({ error: 'Job execution failed' }, { status: 500 })
  }
}
