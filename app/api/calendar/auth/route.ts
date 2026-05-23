import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        {
          error:
            'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local. See .env.local.example for setup instructions.',
        },
        { status: 503 }
      )
    }

    const authUrl = getAuthUrl()
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Calendar auth error:', error)
    return NextResponse.json({ error: 'Failed to initiate OAuth flow' }, { status: 500 })
  }
}
