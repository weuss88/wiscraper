'use client'
import { useEffect, useRef } from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import type { JobStatus } from '@/types'

interface Props {
  jobId: string | null
  status: JobStatus | null
  onStatusChange: (s: JobStatus) => void
  onDone: (jobId: string) => void
}

export default function JobProgress({ jobId, status, onStatusChange, onDone }: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!jobId) return
    intervalRef.current = setInterval(async () => {
      try {
        const s = await api.getJobStatus(jobId)
        onStatusChange(s)
        if (s.status === 'done' || s.status === 'error') {
          clearInterval(intervalRef.current!)
          if (s.status === 'done') onDone(jobId)
        }
      } catch {
        clearInterval(intervalRef.current!)
      }
    }, 2000)
    return () => clearInterval(intervalRef.current!)
  }, [jobId])

  if (!status || !jobId) return null

  const pct = status.total > 0 ? Math.round((status.progress / status.total) * 100) : 0
  const isRunning = status.status === 'running' || status.status === 'pending'
  const isDone = status.status === 'done'
  const isError = status.status === 'error'

  return (
    <div className="card mt-4">
      <div className="flex items-center gap-3 mb-3">
        {isRunning && <Loader2 className="w-5 h-5 text-brand-400 animate-spin shrink-0" />}
        {isDone    && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
        {isError   && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isError ? 'text-red-400' : isDone ? 'text-emerald-400' : 'text-slate-200'}`}>
            {status.message || (isRunning ? 'En cours...' : isDone ? 'Terminé' : 'Erreur')}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {status.progress} / {status.total > 0 ? status.total : '?'} leads
            {isRunning && ' · Mise à jour toutes les 2s'}
          </p>
        </div>
        <span className={`text-sm font-bold tabular-nums ${isError ? 'text-red-400' : isDone ? 'text-emerald-400' : 'text-brand-400'}`}>
          {isDone ? '100%' : isRunning && status.total > 0 ? `${pct}%` : ''}
        </span>
      </div>

      {(isRunning || isDone) && status.total > 0 && (
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : 'bg-brand-500'}`}
            style={{ width: `${isDone ? 100 : pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
