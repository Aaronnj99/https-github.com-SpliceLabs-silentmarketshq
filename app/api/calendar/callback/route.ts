import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL('/settings?calendar=error&reason=' + error, request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?calendar=error&reason=no_code', request.url))
    }

    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.refresh_token && !tokens.access_token) {
      return NextResponse.redirect(
        new URL('/settings?calendar=error&reason=no_token', request.url)
      )
    }

    return NextResponse.redirect(new URL('/settings?calendar=connected', request.url))
  } catch (error) {
    console.error('Calendar callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?calendar=error&reason=exchange_failed', request.url)
    )
  }
}
