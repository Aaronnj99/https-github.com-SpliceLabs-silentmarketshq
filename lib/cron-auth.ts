import { NextRequest } from 'next/server'

export function isAuthorizedCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.warn('[cron] CRON_SECRET not set — allowing request unauthenticated. Set CRON_SECRET before deploying.')
    return true
  }
  return req.headers.get('authorization') === `Bearer ${secret}`
}
