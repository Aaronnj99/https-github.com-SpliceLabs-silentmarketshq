'use client'
import useSWR from 'swr'
import { useEffect } from 'react'
import { useJarvisStore } from '@/store/jarvis'
import type { ReminderItem } from '@/store/jarvis'

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<ReminderItem[]>
  })

export function useReminders() {
  const setReminders = useJarvisStore((s) => s.setReminders)

  const { data, error, isLoading, mutate } = useSWR<ReminderItem[]>(
    '/api/reminders',
    fetcher,
    { refreshInterval: 60 * 1000 } // Refresh every minute
  )

  useEffect(() => {
    if (data) {
      setReminders(data)
    }
  }, [data, setReminders])

  const create = async (
    title: string,
    description?: string,
    dueAt?: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) => {
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, due_at: dueAt, priority }),
    })
    if (!res.ok) throw new Error('Failed to create reminder')
    await mutate()
  }

  const complete = async (id: number) => {
    const res = await fetch(`/api/reminders?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_done: 1 }),
    })
    if (!res.ok) throw new Error('Failed to complete reminder')
    await mutate()
  }

  const remove = async (id: number) => {
    const res = await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete reminder')
    await mutate()
  }

  const update = async (id: number, updates: Partial<ReminderItem>) => {
    const res = await fetch(`/api/reminders?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update reminder')
    await mutate()
  }

  return {
    reminders: data ?? [],
    isLoading,
    error: error?.message,
    create,
    complete,
    remove,
    update,
    refresh: mutate,
  }
}
