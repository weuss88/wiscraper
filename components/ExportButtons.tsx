'use client'
import { Download, FileText, FileJson, Table2 } from 'lucide-react'
import { api } from '@/lib/api'

interface Props {
  jobId: string | null
  total: number
}

export default function ExportButtons({ jobId, total }: Props) {
  if (!jobId || total === 0) return null

  const download = (fmt: 'csv' | 'json' | 'xlsx') => {
    window.open(api.exportUrl(jobId, fmt), '_blank')
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
        <Download className="w-3.5 h-3.5" />
        Exporter {total} leads :
      </span>
      <button onClick={() => download('csv')} className="btn-ghost text-xs py-1.5 px-3">
        <FileText className="w-3.5 h-3.5" />
        CSV
      </button>
      <button onClick={() => download('json')} className="btn-ghost text-xs py-1.5 px-3">
        <FileJson className="w-3.5 h-3.5" />
        JSON
      </button>
      <button onClick={() => download('xlsx')} className="btn-ghost text-xs py-1.5 px-3">
        <Table2 className="w-3.5 h-3.5" />
        Excel
      </button>
    </div>
  )
}
