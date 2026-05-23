import { google } from 'googleapis'
import { getSetting, setSetting } from './db'

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/calendar/callback'
  )
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string | null | undefined
  refresh_token: string | null | undefined
}> {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)

  // Store refresh token
  if (tokens.refresh_token) {
    setSetting('google_refresh_token', tokens.refresh_token)
  }
  if (tokens.access_token) {
    setSetting('google_access_token', tokens.access_token)
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  }
}

export async function getAuthenticatedClient() {
  const refreshToken =
    getSetting('google_refresh_token') ?? process.env.GOOGLE_REFRESH_TOKEN

  if (!refreshToken) {
    throw new Error('No Google refresh token available. Please authenticate first.')
  }

  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  // Refresh access token
  const { credentials } = await oauth2Client.refreshAccessToken()
  oauth2Client.setCredentials(credentials)

  return oauth2Client
}

export interface CalendarEvent {
  id: string
  summary: string
  description: string | null
  start: string
  end: string
  location: string | null
  htmlLink: string | null
  colorId: string | null
  status: string
}

export async function getUpcomingEvents(
  daysAhead = 7,
  maxResults = 20
): Promise<CalendarEvent[]> {
  const auth = await getAuthenticatedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + daysAhead)

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  })

  const items = response.data.items ?? []

  return items.map((event) => ({
    id: event.id ?? '',
    summary: event.summary ?? 'Untitled',
    description: event.description ?? null,
    start: event.start?.dateTime ?? event.start?.date ?? '',
    end: event.end?.dateTime ?? event.end?.date ?? '',
    location: event.location ?? null,
    htmlLink: event.htmlLink ?? null,
    colorId: event.colorId ?? null,
    status: event.status ?? 'confirmed',
  }))
}

export function isCalendarConnected(): boolean {
  const token =
    getSetting('google_refresh_token') ?? process.env.GOOGLE_REFRESH_TOKEN
  return Boolean(token)
}
