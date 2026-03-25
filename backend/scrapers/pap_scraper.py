# ============================================================
#  SCRAPER PAP.fr — B2C France
#  Propriétaires qui vendent/louent sans agence
#  Technique : requests + BeautifulSoup (anti-bot léger)
# ============================================================
import asyncio
import re
import time
from urllib.parse import urljoin, urlencode

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.pap.fr"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9",
    "Referer": "https://www.pap.fr/",
}

PAUSE = 2.0


# ── Utilitaires ───────────────────────────────────────────
def slugify_location(loc: str) -> str:
    """
    Convertit la localisation en slug PAP.
    "75001" → "75001"
    "75"    → "departement-75"
    "Paris" → garde tel quel pour la recherche
    """
    loc = loc.strip()
    if re.match(r'^\d{5}$', loc):
        return loc
    if re.match(r'^\d{2}$', loc):
        return f"departement-{loc}"
    return loc.lower().replace(" ", "-").replace("é", "e").replace("è", "e") \
               .replace("ê", "e").replace("à", "a").replace("î", "i")


def build_pap_search_url(params, page: int = 1) -> str:
    """
    PAP utilise une URL de recherche avec paramètres GET.
    ex: https://www.pap.fr/annonce/ventes-immobilieres-paris-g439?nb-pieces=3
    """
    type_slug = "ventes-immobilieres" if params.type_bien == "ventes" else "locations-immobilieres"
    loc_slug = slugify_location(params.localisation)

    # PAP accepte aussi la recherche directe via /recherche
    search_params: dict = {"place": loc_slug}
    if params.prix_max:
        search_params["prix-max"] = str(params.prix_max)
    if params.pieces_min:
        search_params["nb-pieces"] = str(params.pieces_min)
    if page > 1:
        search_params["page"] = str(page)

    qs = urlencode(search_params)
    return f"{BASE_URL}/annonce/{type_slug}?{qs}"


def fetch_pap_page(url: str) -> str | None:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        if resp.status_code == 200:
            return resp.text
        return None
    except Exception:
        return None


def extract_phone(soup_item: BeautifulSoup) -> str:
    """Cherche un numéro de téléphone dans la fiche."""
    # Lien tel:
    tel_link = soup_item.find("a", href=re.compile(r"^tel:"))
    if tel_link:
        return tel_link.get("href", "").replace("tel:", "").strip()
    # Texte brut
    text = soup_item.get_text()
    m = re.search(r"(?:(?:\+33|0033|0)[1-9])(?:[\s\.\-]?\d{2}){4}", text)
    if m:
        return m.group().strip()
    return ""


def parse_pap_listings(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")

    # PAP utilise des articles ou des li pour chaque annonce
    items = (
        soup.select("article.search-list-item")
        or soup.select("li.search-list-item")
        or soup.select("[data-id]")
        or soup.select(".item-list .item")
    )

    leads = []
    for item in items:
        try:
            # Titre
            titre_el = (
                item.select_one(".item-title")
                or item.select_one("h2")
                or item.select_one(".title")
            )
            titre = titre_el.get_text(strip=True) if titre_el else ""
            if not titre:
                continue

            # Prix
            prix_el = (
                item.select_one(".price")
                or item.select_one(".item-price")
                or item.select_one("[class*='price']")
            )
            prix = prix_el.get_text(strip=True) if prix_el else ""

            # URL
            link_el = item.select_one("a[href]")
            url = urljoin(BASE_URL, link_el["href"]) if link_el else ""

            # Tags (surface, pièces, CP)
            tags_el = item.select(".item-tags span, .tags span, .criteria span")
            tags = [t.get_text(strip=True) for t in tags_el]
            surface = next((t for t in tags if "m²" in t or "m2" in t), "")
            pieces = next((t for t in tags if "pièce" in t.lower() or "p." in t.lower()), "")
            cp_tag = next((t for t in tags if re.match(r'\d{5}', t)), "")

            # Localisation
            loc_el = (
                item.select_one(".item-location")
                or item.select_one(".location")
                or item.select_one("[class*='location']")
            )
            adresse = loc_el.get_text(strip=True) if loc_el else cp_tag

            # Date
            date_el = (
                item.select_one(".item-date")
                or item.select_one("time")
                or item.select_one("[class*='date']")
            )
            date = date_el.get("datetime", date_el.get_text(strip=True)) if date_el else ""

            # Description
            desc_el = (
                item.select_one(".item-description")
                or item.select_one(".description")
            )
            description = (desc_el.get_text(strip=True)[:200] + "…") if desc_el else ""

            # Téléphone
            telephone = extract_phone(item)

            leads.append({
                "source":      "pap",
                "nom":         titre,
                "categorie":   "Immobilier",
                "adresse":     adresse,
                "telephone":   telephone,
                "site_web":    "",
                "note":        "",
                "nb_avis":     "",
                "prix":        prix,
                "surface":     surface,
                "pieces":      pieces,
                "description": description,
                "url":         url,
                "date":        date[:10] if date else "",
            })
        except Exception:
            continue

    return leads


# ── Point d'entrée async ──────────────────────────────────
async def run_pap_scraper(params, progress_cb, save_cb):
    collected = 0
    page = 1
    max_pages = max(1, (params.nb_results // 20) + 2)

    await progress_cb(0, params.nb_results, "Connexion à PAP.fr...")

    while collected < params.nb_results and page <= max_pages:
        url = build_pap_search_url(params, page)
        html = await asyncio.to_thread(fetch_pap_page, url)

        if not html:
            await progress_cb(collected, params.nb_results, f"Échec page {page}")
            break

        leads = await asyncio.to_thread(parse_pap_listings, html)
        if not leads:
            break

        for lead in leads:
            if collected >= params.nb_results:
                break
            await save_cb(lead)
            collected += 1
            await progress_cb(collected, params.nb_results, lead["nom"])

        page += 1
        await asyncio.sleep(PAUSE)

    await progress_cb(collected, collected, f"{collected} annonces PAP collectées")
