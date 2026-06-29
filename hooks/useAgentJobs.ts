'use client'
import useSWR from 'swr'
import type { AgentJobRun } from '@/lib/db'

export interface AgentStation {
  key: string
  name: string
  description: string
  cron: string
  latestRun: AgentJobRun | null
}

interface JobsResponse {
  stations: AgentStation[]
  history: AgentJobRun[]
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<JobsResponse>
  })

export function useAgentJobs() {
  const { data, error, isLoading, mutate } = useSWR<JobsResponse>('/api/jobs', fetcher, {
    refreshInterval: 8 * 1000,
  })

  const runNow = async (key: string) => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    await mutate()
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Job execution failed')
    }
  }

  return {
    stations: data?.stations ?? [],
    history: data?.history ?? [],
    isLoading,
    error: error?.message,
    runNow,
    refresh: mutate,
  }
}
