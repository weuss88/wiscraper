'use client'
import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ExternalLink, Phone, Globe, Search } from 'lucide-react'
import type { Lead, ScraperSource } from '@/types'
import clsx from 'clsx'

interface Props {
  leads: Lead[]
  source: ScraperSource | null
}

type SortKey = keyof Lead
type SortDir = 'asc' | 'desc'

const B2B_COLS: { key: keyof Lead; label: string; width: string }[] = [
  { key: 'nom',       label: 'Nom',       width: 'w-52' },
  { key: 'categorie', label: 'Catégorie', width: 'w-36' },
  { key: 'adresse',   label: 'Adresse',   width: 'w-52' },
  { key: 'telephone', label: 'Téléphone', width: 'w-36' },
  { key: 'site_web',  label: 'Site web',  width: 'w-40' },
  { key: 'note',      label: 'Note',      width: 'w-20' },
  { key: 'nb_avis',   label: 'Avis',      width: 'w-20' },
]

const B2C_LBC_COLS: { key: keyof Lead; label: string; width: string }[] = [
  { key: 'nom',         label: 'Titre',          width: 'w-64' },
  { key: 'prix',        label: 'Prix',           width: 'w-28' },
  { key: 'adresse',     label: 'Ville / CP',     width: 'w-36' },
  { key: 'surface',     label: 'Surface',        width: 'w-24' },
  { key: 'pieces',      label: 'Pièces',         width: 'w-20' },
  { key: 'categorie',   label: 'Catégorie',      width: 'w-32' },
  { key: 'date',        label: 'Date',           width: 'w-24' },
]

const B2C_PAP_COLS: { key: keyof Lead; label: string; width: string }[] = [
  { key: 'nom',       label: 'Titre',      width: 'w-64' },
  { key: 'prix',      label: 'Prix',       width: 'w-28' },
  { key: 'surface',   label: 'Surface',    width: 'w-24' },
  { key: 'pieces',    label: 'Pièces',     width: 'w-20' },
  { key: 'adresse',   label: 'Localisation', width: 'w-36' },
  { key: 'telephone', label: 'Téléphone',  width: 'w-36' },
  { key: 'date',      label: 'Date',       width: 'w-24' },
]

function getCols(source: ScraperSource | null) {
  if (source === 'leboncoin') return B2C_LBC_COLS
  if (source === 'pap')       return B2C_PAP_COLS
  return B2B_COLS
}

const SOURCE_BADGE: Record<string, string> = {
  maps_fr:   'bg-blue-900/60 text-blue-300',
  maps_be:   'bg-purple-900/60 text-purple-300',
  leboncoin: 'bg-orange-900/60 text-orange-300',
  pap:       'bg-emerald-900/60 text-emerald-300',
}

const SOURCE_LABEL: Record<string, string> = {
  maps_fr:   'Maps FR',
  maps_be:   'Maps BE',
  leboncoin: 'LeBonCoin',
  pap:       'PAP.fr',
}

const PAGE_SIZE = 25

export default function ResultsTable({ leads, source }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('nom')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)

  const cols = getCols(source)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter(l =>
      !q ||
      Object.values(l).some(v => String(v).toLowerCase().includes(q))
    )
  }, [leads, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey] ?? '')
      const bv = String(b[sortKey] ?? '')
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [filtered, sortKey, sortDir])

  const pages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageLeads = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  if (leads.length === 0) return null

  return (
    <div className="card mt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-sm text-slate-400">{filtered.length} lead{filtered.length > 1 ? 's' : ''}</span>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            className="input pl-8 py-1.5 text-xs"
            placeholder="Rechercher..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-800/80">
            <tr>
              {cols.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={clsx(
                    'px-3 py-2.5 text-left font-semibold text-slate-400 cursor-pointer',
                    'hover:text-slate-200 select-none whitespace-nowrap', col.width
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key
                      ? sortDir === 'asc'
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />
                      : <ChevronUp className="w-3 h-3 opacity-20" />}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2.5 text-left font-semibold text-slate-400 w-20">Lien</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {pageLeads.map((lead, i) => (
              <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                {cols.map(col => (
                  <td key={col.key} className="px-3 py-2.5 text-slate-300">
                    {col.key === 'telephone' && lead.telephone ? (
                      <a
                        href={`tel:${lead.telephone}`}
                        className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300"
                      >
                        <Phone className="w-3 h-3" />
                        {lead.telephone}
                      </a>
                    ) : col.key === 'site_web' && lead.site_web ? (
                      <a
                        href={lead.site_web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 max-w-[140px] truncate"
                      >
                        <Globe className="w-3 h-3 shrink-0" />
                        <span className="truncate">{lead.site_web.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                      </a>
                    ) : col.key === 'note' && lead.note ? (
                      <span className="text-amber-400 font-semibold">★ {lead.note}</span>
                    ) : col.key === 'source' ? (
                      <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-semibold', SOURCE_BADGE[lead.source] || 'bg-slate-700 text-slate-300')}>
                        {SOURCE_LABEL[lead.source] || lead.source}
                      </span>
                    ) : (
                      <span className="line-clamp-2 max-w-[200px]">
                        {String(lead[col.key] ?? '')}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-3 py-2.5">
                  {lead.url && (
                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-brand-400 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-500">
            Page {page} / {pages}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="btn-ghost text-xs py-1 px-2" disabled={page === 1}>←</button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i
              if (p < 1 || p > pages) return null
              return (
                <button key={p} onClick={() => setPage(p)} className={clsx('btn-ghost text-xs py-1 px-2', p === page && 'border-brand-500 text-brand-400')}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} className="btn-ghost text-xs py-1 px-2" disabled={page === pages}>→</button>
          </div>
        </div>
      )}
    </div>
  )
}
