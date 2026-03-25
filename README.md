# WiScrap — Scraper multi-sources

Collecte automatique de leads B2B et B2C pour la France et la Belgique.

## Sources

| Onglet | Source | Cible |
|--------|--------|-------|
| B2B Maps France | Google Maps | Pros France (plombier, chauffagiste…) |
| B2B Maps Belgique | Google Maps | Pros Belgique (même scraper) |
| LeBonCoin B2C | LeBonCoin.fr | Propriétaires, petites annonces |
| PAP.fr B2C | PAP.fr | Propriétaires sans agence |

## Démarrage local

### Backend (Python)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000
```

### Frontend (Next.js)

```bash
cp .env.local.example .env.local
# Vérifier que NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
# → http://localhost:3000
```

## Déploiement

### Backend → Railway

1. Connecter le repo GitHub sur [railway.app](https://railway.app)
2. Sélectionner le service backend
3. Railway détecte automatiquement `railway.toml`
4. Copier l'URL générée (ex: `https://wiscrap-backend.up.railway.app`)

### Frontend → Vercel

1. Connecter le repo GitHub sur [vercel.com](https://vercel.com)
2. Ajouter la variable d'environnement :
   ```
   NEXT_PUBLIC_API_URL=https://wiscrap-backend.up.railway.app
   ```
3. Deploy → URL générée automatiquement

## Filtres disponibles

### Google Maps (B2B)
- Secteur / activité
- Ville, département (`75`) ou code postal (`75001`)
- Nombre de résultats (5–200)
- Avec téléphone / avec site web

### LeBonCoin (B2C)
- Mots-clés + localisation (ville / `75` / `75001`)
- Catégorie (Immobilier, Voitures, Bricolage, Services…)
- Prix min / max
- Type vendeur (Tous / Particulier / Professionnel)

### PAP.fr (B2C)
- Localisation (ville / `75` / `75001`)
- Type : Ventes / Locations
- Prix max, pièces min

## Export

Tous les résultats sont exportables en **CSV**, **JSON** et **Excel (.xlsx)**.
