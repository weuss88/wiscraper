export type ScraperSource = 'maps_fr' | 'maps_be' | 'leboncoin' | 'pap'

export interface MapsParams {
  secteur: string
  localisation: string
  pays: 'FR' | 'BE'
  nb_results: number
  avec_telephone: boolean
  avec_site: boolean
}

export interface LeboncoinParams {
  keywords: string
  localisation: string
  categorie_id: number
  prix_min: number | null
  prix_max: number | null
  type_vendeur: 'all' | 'private' | 'professional'
  nb_results: number
}

export interface PapParams {
  localisation: string
  type_bien: 'ventes' | 'locations'
  prix_max: number | null
  pieces_min: number | null
  nb_results: number
}

export interface ScrapeRequest {
  source: ScraperSource
  maps?: MapsParams
  leboncoin?: LeboncoinParams
  pap?: PapParams
}

export interface Lead {
  source: string
  nom: string
  categorie: string
  adresse: string
  telephone: string
  site_web: string
  note: string
  nb_avis: string
  prix: string
  surface: string
  pieces: string
  description: string
  url: string
  date: string
}

export interface JobStatus {
  id: string
  source: string
  status: 'pending' | 'running' | 'done' | 'error'
  progress: number
  total: number
  message: string
  created_at: string
}

export interface LeboncoinCategory {
  id: number
  label: string
}

export const LEBONCOIN_CATEGORIES: LeboncoinCategory[] = [
  { id: 0,  label: 'Toutes catégories' },
  { id: 9,  label: 'Immobilier — Ventes' },
  { id: 10, label: 'Immobilier — Locations' },
  { id: 12, label: 'Maison & Bricolage' },
  { id: 2,  label: 'Véhicules — Voitures' },
  { id: 3,  label: 'Véhicules — Motos' },
  { id: 8,  label: 'Services' },
  { id: 15, label: 'Électronique' },
]
