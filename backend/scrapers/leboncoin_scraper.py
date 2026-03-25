# ============================================================
#  SCRAPER LEBONCOIN — B2C France
#  Technique : curl_cffi (bypass Datadome / TLS fingerprinting)
#  Parse     : <script id="__NEXT_DATA__"> JSON embarqué
# ============================================================
import asyncio
import json
import re
import time
from urllib.parse import quote

from bs4 import BeautifulSoup

try:
    from curl_cffi import requests as cffi_requests
    HAS_CURL_CFFI = True
except ImportError:
    import requests as cffi_requests
    HAS_CURL_CFFI = False

# ── Catégories LeBonCoin ──────────────────────────────────
CATEGORIES = {
    0:  "Toutes catégories",
    9:  "Immobilier — Ventes",
    10: "Immobilier — Locations",
    12: "Maison & Bricolage",
    2:  "Véhicules — Voitures",
    3:  "Véhicules — Motos",
    8:  "Services",
    15: "Électronique",
    6:  "Ameublement",
    7:  "Vêtements",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
}

PAUSE_BETWEEN_PAGES = 2.0   # secondes entre pages


# ── Utilitaires ───────────────────────────────────────────
def parse_cp_location(loc: str) -> dict:
    """
    Retourne les paramètres d'URL LeBonCoin selon le format du CP.
    - "75"    → département {"department_id": "75"}
    - "75001" → CP          {"zipcode": "75001"}
    - "Paris" → ville       {"city": "Paris"}
    """
    loc = loc.strip()
    if re.match(r'^\d{2}$', loc):
        return {"department_id": loc}
    if re.match(r'^\d{5}$', loc):
        return {"zipcode": loc}
    return {"city": loc}


def build_lbc_url(params, page: int = 1) -> str:
    base = "https://www.leboncoin.fr/recherche/"
    p = []
    if params.categorie_id and params.categorie_id != 0:
        p.append(f"category={params.categorie_id}")
    if params.keywords:
        p.append(f"text={quote(params.keywords)}")
    if params.type_vendeur != "all":
        p.append(f"owner_type={params.type_vendeur}")

    loc_params = parse_cp_location(params.localisation)
    for k, v in loc_params.items():
        p.append(f"locations={v}")  # simplifié — LBC accepte aussi le format direct

    price_parts = []
    if params.prix_min is not None:
        price_parts.append(str(params.prix_min))
    else:
        price_parts.append("min")
    if params.prix_max is not None:
        price_parts.append(str(params.prix_max))
    else:
        price_parts.append("max")
    if params.prix_min is not None or params.prix_max is not None:
        p.append(f"price={'_'.join(price_parts)}")

    if page > 1:
        p.append(f"page={page}")

    return base + ("?" + "&".join(p) if p else "")


def fetch_page(url: str) -> str | None:
    try:
        if HAS_CURL_CFFI:
            resp = cffi_requests.get(url, impersonate="chrome120", headers=HEADERS, timeout=20)
        else:
            resp = cffi_requests.get(url, headers=HEADERS, timeout=20)
        if resp.status_code == 200:
            return resp.text
        return None
    except Exception:
        return None


def parse_ads(html: str) -> list[dict]:
    """Extrait les annonces depuis __NEXT_DATA__ JSON."""
    soup = BeautifulSoup(html, "html.parser")
    script = soup.find("script", {"id": "__NEXT_DATA__"})
    if not script or not script.string:
        return []
    try:
        data = json.loads(script.string)
        ads = (
            data.get("props", {})
            .get("pageProps", {})
            .get("initialProps", {})
            .get("searchData", {})
            .get("ads", [])
        )
        return ads
    except (json.JSONDecodeError, KeyError, TypeError):
        return []


def format_lead(ad: dict) -> dict:
    location = ad.get("location", {})
    owner = ad.get("owner", {})
    price_list = ad.get("price", [])
    attrs = {a.get("key"): a.get("value_label", a.get("value", ""))
             for a in ad.get("attributes", [])}

    return {
        "source":      "leboncoin",
        "nom":         ad.get("subject", ""),
        "categorie":   ad.get("category_name", ""),
        "adresse":     location.get("city", "") + (f" {location.get('zipcode', '')}" if location.get("zipcode") else ""),
        "telephone":   "",  # nécessite clic sur l'annonce
        "site_web":    "",
        "note":        "",
        "nb_avis":     "",
        "prix":        str(price_list[0]) + " €" if price_list else "",
        "surface":     attrs.get("square", "") or attrs.get("rooms_surface_area", ""),
        "pieces":      attrs.get("rooms", ""),
        "description": (ad.get("body", "")[:200] + "…") if ad.get("body") else "",
        "url":         "https://www.leboncoin.fr" + ad.get("url", ""),
        "date":        ad.get("first_publication_date", "")[:10],
    }


# ── Point d'entrée async ──────────────────────────────────
async def run_leboncoin_scraper(params, progress_cb, save_cb):
    collected = 0
    page = 1
    max_pages = max(1, (params.nb_results // 35) + 2)  # ~35 annonces/page

    await progress_cb(0, params.nb_results, "Connexion à LeBonCoin...")

    while collected < params.nb_results and page <= max_pages:
        url = build_lbc_url(params, page)
        html = await asyncio.to_thread(fetch_page, url)

        if not html:
            await progress_cb(collected, params.nb_results, f"Échec page {page}")
            break

        ads = await asyncio.to_thread(parse_ads, html)
        if not ads:
            break

        for ad in ads:
            if collected >= params.nb_results:
                break
            lead = format_lead(ad)
            await save_cb(lead)
            collected += 1
            await progress_cb(collected, params.nb_results, lead["nom"])

        page += 1
        await asyncio.sleep(PAUSE_BETWEEN_PAGES)

    await progress_cb(collected, collected, f"{collected} annonces collectées")
