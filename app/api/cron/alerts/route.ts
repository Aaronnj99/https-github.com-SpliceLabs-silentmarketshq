import { NextRequest, NextResponse } from 'next/server'
import { runAlertSweep, formatAlertMessage } from '@/lib/alerts'
import { isAuthorizedCronRequest } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { checked, triggered } = await runAlertSweep()
    return NextResponse.json({
      checked,
      triggered: triggered.map((t) => ({
        ...t,
        message: formatAlertMessage(t.alert, t.currentPrice),
      })),
    })
  } catch (err) {
    console.error('[cron/alerts]', err)
    return NextResponse.json({ error: 'Alert sweep failed' }, { status: 500 })
  }
}
