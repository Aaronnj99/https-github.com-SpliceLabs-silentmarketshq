import { NextResponse } from 'next/server'
import { isTelegramConfigured, sendTelegramMessage } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ configured: isTelegramConfigured() })
}

export async function POST() {
  if (!isTelegramConfigured()) {
    return NextResponse.json(
      { configured: false, error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set' },
      { status: 400 }
    )
  }

  await sendTelegramMessage('🤖 <b>JARVIS</b>\nTelegram notifications are connected.')
  return NextResponse.json({ configured: true })
}
