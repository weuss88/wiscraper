'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import type { MapsParams, ScraperSource } from '@/types'

interface Props {
  pays: 'FR' | 'BE'
  onSubmit: (source: ScraperSource, maps: MapsParams) => void
  loading: boolean
}

const SECTEURS_SUGGERES = [
  'plombier', 'chauffagiste', 'électricien', 'menuisier', 'peintre',
  'maçon', 'couvreur', 'carreleur', 'serrurier', 'climatisation',
]

export default function MapsForm({ pays, onSubmit, loading }: Props) {
  const [secteur, setSecteur] = useState('')
  const [localisation, setLocalisation] = useState('')
  const [nbResults, setNbResults] = useState(20)
  const [avecTel, setAvecTel] = useState(false)
  const [avecSite, setAvecSite] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!secteur.trim() || !localisation.trim()) return
    onSubmit(pays === 'BE' ? 'maps_be' : 'maps_fr', {
      secteur: secteur.trim(),
      localisation: localisation.trim(),
      pays,
      nb_results: nbResults,
      avec_telephone: avecTel,
      avec_site: avecSite,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Secteur / Activité</label>
          <input
            className="input"
            placeholder="ex: plombier, chauffagiste, électricien"
            value={secteur}
            onChange={e => setSecteur(e.target.value)}
            required
          />
          <div className="flex flex-wrap gap-1 mt-1.5">
            {SECTEURS_SUGGERES.slice(0, 5).map(s => (
              <button
                key={s} type="button"
                onClick={() => setSecteur(s)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Ville / Code postal
            <span className="ml-2 text-slate-600 font-normal">(ex: Paris, 75, 75001{pays === 'BE' ? ', Bruxelles, 1000' : ''})</span>
          </label>
          <input
            className="input"
            placeholder={pays === 'BE' ? 'ex: Bruxelles ou 1000' : 'ex: Paris ou 75 ou 75001'}
            value={localisation}
            onChange={e => setLocalisation(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Nombre de résultats : <span className="text-white font-semibold">{nbResults}</span>
          </label>
          <input
            type="range" min={5} max={200} step={5}
            value={nbResults}
            onChange={e => setNbResults(+e.target.value)}
            className="w-full accent-brand-500"
          />
        </div>

        <div className="flex items-center gap-4 pt-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setAvecTel(v => !v)}
              className={`w-9 h-5 rounded-full transition-colors ${avecTel ? 'bg-brand-600' : 'bg-slate-700'} relative cursor-pointer`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${avecTel ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs text-slate-300">Avec téléphone</span>
          </label>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setAvecSite(v => !v)}
              className={`w-9 h-5 rounded-full transition-colors ${avecSite ? 'bg-brand-600' : 'bg-slate-700'} relative cursor-pointer`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${avecSite ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs text-slate-300">Avec site web</span>
          </label>
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        <Search className="w-4 h-4" />
        {loading ? 'En cours...' : `Lancer le scraping Google Maps ${pays}`}
      </button>
    </form>
  )
}
