'use client'
import { useState } from 'react'
import { MapPin, ShoppingBag, Home, Globe2 } from 'lucide-react'
import clsx from 'clsx'
import { api } from '@/lib/api'
import type { JobStatus, Lead, ScraperSource, MapsParams, LeboncoinParams, PapParams } from '@/types'
import MapsForm from '@/components/MapsForm'
import LeboncoinForm from '@/components/LeboncoinForm'
import PapForm from '@/components/PapForm'
import JobProgress from '@/components/JobProgress'
import ResultsTable from '@/components/ResultsTable'
import ExportButtons from '@/components/ExportButtons'

type TabId = 'maps_fr' | 'maps_be' | 'leboncoin' | 'pap'

const TABS: { id: TabId; label: string; emoji: string; color: string }[] = [
  { id: 'maps_fr',   label: 'B2B Maps France',   emoji: '🇫🇷', color: 'text-blue-400' },
  { id: 'maps_be',   label: 'B2B Maps Belgique', emoji: '🇧🇪', color: 'text-purple-400' },
  { id: 'leboncoin', label: 'LeBonCoin B2C',     emoji: '🟠', color: 'text-orange-400' },
  { id: 'pap',       label: 'PAP.fr B2C',        emoji: '🟢', color: 'text-emerald-400' },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('maps_fr')
  const [jobId, setJobId]         = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [leads, setLeads]         = useState<Lead[]>([])
  const [currentSource, setCurrentSource] = useState<ScraperSource | null>(null)
  const loading = jobStatus?.status === 'running' || jobStatus?.status === 'pending'

  const handleDone = async (id: string) => {
    const data = await api.getResults(id)
    setLeads(data.results)
  }

  const startJob = async (source: ScraperSource, params: MapsParams | LeboncoinParams | PapParams) => {
    setLeads([])
    setJobStatus(null)
    setCurrentSource(source)

    const body = source === 'maps_fr' || source === 'maps_be'
      ? { source, maps: params as MapsParams }
      : source === 'leboncoin'
        ? { source, leboncoin: params as LeboncoinParams }
        : { source, pap: params as PapParams }

    const { job_id } = await api.startScrape(body)
    setJobId(job_id)
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Globe2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">WiScrap</h1>
              <p className="text-[10px] text-slate-500 leading-none">Google Maps · LeBonCoin · PAP.fr</p>
            </div>
          </div>
          {leads.length > 0 && (
            <ExportButtons jobId={jobId} total={leads.length} />
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Hero */}
        <div className="text-center pb-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Collecte de leads <span className="text-brand-400">B2B & B2C</span>
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            France · Belgique · Google Maps · LeBonCoin · PAP.fr
          </p>
        </div>

        {/* Tabs */}
        <div className="card p-0 overflow-hidden">
          <div className="flex border-b border-slate-800">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex-1 px-2 sm:px-4 py-3.5 text-xs sm:text-sm font-medium transition-all',
                  'border-b-2 hover:bg-slate-800/40',
                  activeTab === tab.id
                    ? 'border-brand-500 bg-slate-800/60 ' + tab.color
                    : 'border-transparent text-slate-500'
                )}
              >
                <span className="mr-1.5">{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'maps_fr' && (
              <MapsForm
                pays="FR"
                onSubmit={(source, p) => startJob(source, p)}
                loading={loading}
              />
            )}
            {activeTab === 'maps_be' && (
              <MapsForm
                pays="BE"
                onSubmit={(source, p) => startJob(source, p)}
                loading={loading}
              />
            )}
            {activeTab === 'leboncoin' && (
              <LeboncoinForm
                onSubmit={p => startJob('leboncoin', p)}
                loading={loading}
              />
            )}
            {activeTab === 'pap' && (
              <PapForm
                onSubmit={p => startJob('pap', p)}
                loading={loading}
              />
            )}
          </div>
        </div>

        {/* Progression */}
        <JobProgress
          jobId={jobId}
          status={jobStatus}
          onStatusChange={setJobStatus}
          onDone={handleDone}
        />

        {/* Export (mobile) */}
        {leads.length > 0 && (
          <div className="sm:hidden">
            <ExportButtons jobId={jobId} total={leads.length} />
          </div>
        )}

        {/* Résultats */}
        <ResultsTable leads={leads} source={currentSource} />

        {/* Stats */}
        {leads.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total leads', value: leads.length, color: 'text-brand-400' },
              { label: 'Avec téléphone', value: leads.filter(l => l.telephone).length, color: 'text-emerald-400' },
              { label: 'Avec site web', value: leads.filter(l => l.site_web).length, color: 'text-blue-400' },
              { label: 'Avec prix', value: leads.filter(l => l.prix).length, color: 'text-amber-400' },
            ].map(stat => (
              <div key={stat.label} className="card text-center py-4">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16 py-6 text-center text-xs text-slate-600">
        WiScrap — Scraper Google Maps · LeBonCoin · PAP.fr · France &amp; Belgique
      </footer>
    </main>
  )
}
