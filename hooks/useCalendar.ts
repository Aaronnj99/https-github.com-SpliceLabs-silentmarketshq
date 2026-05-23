'use client'
import useSWR from 'swr'
import { useEffect } from 'react'
import { useJarvisStore } from '@/store/jarvis'
import type { CalendarEvent } from '@/store/jarvis'

interface CalendarResponse {
  connected: boolean
  events: CalendarEvent[]
  error?: string
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<CalendarResponse>
  })

export function useCalendar() {
  const setCalendarEvents = useJarvisStore((s) => s.setCalendarEvents)
  const setCalendarConnected = useJarvisStore((s) => s.setCalendarConnected)

  const { data, error, isLoading, mutate } = useSWR<CalendarResponse>(
    '/api/calendar/events',
    fetcher,
    { refreshInterval: 5 * 60 * 1000 } // Refresh every 5 minutes
  )

  useEffect(() => {
    if (data) {
      setCalendarEvents(data.events ?? [])
      setCalendarConnected(data.connected ?? false)
    }
  }, [data, setCalendarEvents, setCalendarConnected])

  return {
    events: data?.events ?? [],
    connected: data?.connected ?? false,
    isLoading,
    error: error?.message ?? data?.error,
    refresh: mutate,
  }
}
