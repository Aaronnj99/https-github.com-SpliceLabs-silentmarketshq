'use client'
import useSWR from 'swr'
import { useEffect } from 'react'
import { useJarvisStore } from '@/store/jarvis'
import type { ObsidianNote } from '@/store/jarvis'

interface NotesResponse {
  configured: boolean
  notes: ObsidianNote[]
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<NotesResponse>
  })

export function useObsidian(searchQuery?: string) {
  const setObsidianNotes = useJarvisStore((s) => s.setObsidianNotes)
  const setObsidianConfigured = useJarvisStore((s) => s.setObsidianConfigured)

  const endpoint = searchQuery
    ? `/api/obsidian/search?q=${encodeURIComponent(searchQuery)}`
    : '/api/obsidian/notes'

  const { data, error, isLoading, mutate } = useSWR<NotesResponse>(
    endpoint,
    fetcher,
    {
      refreshInterval: searchQuery ? 0 : 2 * 60 * 1000,
      dedupingInterval: 5000,
    }
  )

  useEffect(() => {
    if (data) {
      setObsidianNotes(data.notes ?? [])
      setObsidianConfigured(data.configured ?? false)
    }
  }, [data, setObsidianNotes, setObsidianConfigured])

  const createNote = async (title: string, content: string) => {
    const res = await fetch('/api/obsidian/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
    if (!res.ok) throw new Error('Failed to create note')
    await mutate()
    return res.json() as Promise<ObsidianNote>
  }

  return {
    notes: data?.notes ?? [],
    configured: data?.configured ?? false,
    isLoading,
    error: error?.message,
    createNote,
    refresh: mutate,
  }
}
