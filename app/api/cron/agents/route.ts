import { NextRequest, NextResponse } from 'next/server'
import { AGENT_JOBS, executeJob } from '@/lib/agent-jobs'
import { isAuthorizedCronRequest } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  const key = req.nextUrl.searchParams.get('key')
  const jobs = key ? AGENT_JOBS.filter((j) => j.key === key) : AGENT_JOBS

  if (key && jobs.length === 0) {
    return NextResponse.json({ error: `Unknown job: ${key}` }, { status: 400 })
  }

  const runs = await Promise.all(jobs.map((spec) => executeJob(spec)))
  return NextResponse.json({ runs })
}
