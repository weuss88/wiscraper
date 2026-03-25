'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import type { LeboncoinParams } from '@/types'
import { LEBONCOIN_CATEGORIES } from '@/types'

interface Props {
  onSubmit: (params: LeboncoinParams) => void
  loading: boolean
}

export default function LeboncoinForm({ onSubmit, loading }: Props) {
  const [keywords, setKeywords] = useState('')
  const [localisation, setLocalisation] = useState('')
  const [categorieId, setCategorieId] = useState(9)
  const [prixMin, setPrixMin] = useState('')
  const [prixMax, setPrixMax] = useState('')
  const [typeVendeur, setTypeVendeur] = useState<'all' | 'private' | 'professional'>('all')
  const [nbResults, setNbResults] = useState(50)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      keywords: keywords.trim(),
      localisation: localisation.trim(),
      categorie_id: categorieId,
      prix_min: prixMin ? +prixMin : null,
      prix_max: prixMax ? +prixMax : null,
      type_vendeur: typeVendeur,
      nb_results: nbResults,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Mots-clés</label>
          <input
            className="input"
            placeholder="ex: maison à vendre, appartement, canapé..."
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Localisation
            <span className="ml-2 text-slate-600 font-normal">(ville, 75 ou 75001)</span>
          </label>
          <input
            className="input"
            placeholder="ex: Paris ou 75 ou 75001"
            value={localisation}
            onChange={e => setLocalisation(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Catégorie</label>
          <select
            className="input"
            value={categorieId}
            onChange={e => setCategorieId(+e.target.value)}
          >
            {LEBONCOIN_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Type vendeur</label>
          <select
            className="input"
            value={typeVendeur}
            onChange={e => setTypeVendeur(e.target.value as 'all' | 'private' | 'professional')}
          >
            <option value="all">Tous</option>
            <option value="private">Particulier</option>
            <option value="professional">Professionnel</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Résultats : <span className="text-white font-semibold">{nbResults}</span>
          </label>
          <input
            type="range" min={10} max={200} step={10}
            value={nbResults}
            onChange={e => setNbResults(+e.target.value)}
            className="w-full accent-orange-500 mt-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Prix min (€)</label>
          <input
            type="number" className="input" placeholder="ex: 50000"
            value={prixMin} onChange={e => setPrixMin(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Prix max (€)</label>
          <input
            type="number" className="input" placeholder="ex: 300000"
            value={prixMax} onChange={e => setPrixMax(e.target.value)}
          />
        </div>
      </div>

      <button type="submit" className="btn-primary bg-orange-600 hover:bg-orange-700" disabled={loading}>
        <Search className="w-4 h-4" />
        {loading ? 'En cours...' : 'Lancer le scraping LeBonCoin'}
      </button>
    </form>
  )
}
