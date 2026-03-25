'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import type { PapParams } from '@/types'

interface Props {
  onSubmit: (params: PapParams) => void
  loading: boolean
}

export default function PapForm({ onSubmit, loading }: Props) {
  const [localisation, setLocalisation] = useState('')
  const [typeBien, setTypeBien] = useState<'ventes' | 'locations'>('ventes')
  const [prixMax, setPrixMax] = useState('')
  const [piecesMin, setPiecesMin] = useState('')
  const [nbResults, setNbResults] = useState(50)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      localisation: localisation.trim(),
      type_bien: typeBien,
      prix_max: prixMax ? +prixMax : null,
      pieces_min: piecesMin ? +piecesMin : null,
      nb_results: nbResults,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Localisation
            <span className="ml-2 text-slate-600 font-normal">(ville, 75 ou 75001)</span>
          </label>
          <input
            className="input"
            placeholder="ex: Lyon ou 69 ou 69001"
            value={localisation}
            onChange={e => setLocalisation(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Type de bien</label>
          <div className="flex gap-2">
            {(['ventes', 'locations'] as const).map(t => (
              <button
                key={t} type="button"
                onClick={() => setTypeBien(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  typeBien === t
                    ? 'bg-emerald-700 border-emerald-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {t === 'ventes' ? 'Ventes' : 'Locations'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Prix max (€)</label>
          <input
            type="number" className="input" placeholder="ex: 400000"
            value={prixMax} onChange={e => setPrixMax(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Pièces min</label>
          <select className="input" value={piecesMin} onChange={e => setPiecesMin(e.target.value)}>
            <option value="">Indifférent</option>
            <option value="1">1+ pièce</option>
            <option value="2">2+ pièces</option>
            <option value="3">3+ pièces</option>
            <option value="4">4+ pièces</option>
            <option value="5">5+ pièces</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Résultats : <span className="text-white font-semibold">{nbResults}</span>
          </label>
          <input
            type="range" min={10} max={100} step={10}
            value={nbResults}
            onChange={e => setNbResults(+e.target.value)}
            className="w-full accent-emerald-500 mt-2"
          />
        </div>
      </div>

      <div className="rounded-lg bg-emerald-950/30 border border-emerald-900/40 px-4 py-3 text-xs text-emerald-400">
        PAP.fr = propriétaires qui vendent/louent sans agence → prospects idéaux pour
        isolation, PAC, fenêtres, chauffage.
      </div>

      <button type="submit" className="btn-primary bg-emerald-700 hover:bg-emerald-800" disabled={loading}>
        <Search className="w-4 h-4" />
        {loading ? 'En cours...' : 'Lancer le scraping PAP.fr'}
      </button>
    </form>
  )
}
