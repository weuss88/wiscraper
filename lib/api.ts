import type { JobStatus, Lead, ScrapeRequest } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`)
  return res.json()
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return res.json()
}

export const api = {
  startScrape: (req: ScrapeRequest) =>
    post<{ job_id: string }>('/api/scrape', req),

  getJobStatus: (jobId: string) =>
    get<JobStatus>(`/api/jobs/${jobId}`),

  getResults: (jobId: string) =>
    get<{ results: Lead[]; total: number }>(`/api/results/${jobId}`),

  deleteJob: (jobId: string) =>
    fetch(`${API}/api/jobs/${jobId}`, { method: 'DELETE' }),

  exportUrl: (jobId: string, fmt: 'csv' | 'json' | 'xlsx') =>
    `${API}/api/export/${jobId}/${fmt}`,
}
