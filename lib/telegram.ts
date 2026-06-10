import axios from 'axios'

const TELEGRAM_API = 'https://api.telegram.org'

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) return

  try {
    await axios.post(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    })
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.description ?? error.message
      : error instanceof Error ? error.message : 'unknown error'
    console.error('Telegram notification failed:', message)
  }
}
