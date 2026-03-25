# ============================================================
#  SCRAPER GOOGLE MAPS v6
#  Auteur  : Al Housseynou Ndiaye
#  B2B France + Belgique
#  Filtres : secteur, ville/CP (format 75 ou 75001), téléphone, site
#  Export  : CSV + JSON + Excel (via FastAPI /export)
# ============================================================
import asyncio
import re
import time
from urllib.parse import quote

from selenium import webdriver
from selenium.common.exceptions import (StaleElementReferenceException,
                                        TimeoutException, WebDriverException)
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

try:
    from webdriver_manager.chrome import ChromeDriverManager
    USE_WDM = True
except ImportError:
    USE_WDM = False

# ── Config ────────────────────────────────────────────────
WAIT_SEC         = 12
PAGELOAD_SEC     = 35
SCROLL_PAUSE_SEC = 0.8
MAX_SCROLL_TRIES = 30
RETRIES_PER_URL  = 2


# ── Utilitaires ───────────────────────────────────────────
def parse_location(loc: str) -> str:
    """
    Normalise la localisation saisie par l'utilisateur.
    - "75"    → département → "département 75"
    - "75001" → code postal → laissé tel quel (Google Maps comprend)
    - "1000"  → CP belge 4 chiffres → laissé tel quel
    - "Paris" → ville normale
    """
    loc = loc.strip()
    if re.match(r'^\d{2}$', loc):
        return f"département {loc}"
    return loc


def build_maps_url(secteur: str, localisation: str, pays: str) -> str:
    loc = parse_location(localisation)
    suffix = " Belgique" if pays == "BE" else ""
    query = f"{secteur} {loc}{suffix}"
    return f"https://www.google.com/maps/search/{quote(query)}"


def init_driver() -> webdriver.Chrome:
    options = webdriver.ChromeOptions()
    options.page_load_strategy = "eager"
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-notifications")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    options.add_argument("--lang=fr-FR")
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    if USE_WDM:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    else:
        driver = webdriver.Chrome(options=options)

    driver.set_page_load_timeout(PAGELOAD_SEC)
    driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    return driver


def try_click(driver, selectors, timeout=2.5) -> bool:
    for sel in selectors:
        try:
            el = WebDriverWait(driver, timeout).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, sel))
            )
            el.click()
            return True
        except Exception:
            pass
    return False


# ── Étape 1 : Collecter les liens ─────────────────────────
def collecter_liens(driver, nb_cible: int) -> list[dict]:
    liens, vus = [], set()
    panneau = None
    for sel in ["div[role='feed']", "div.m6QErb[role='feed']"]:
        try:
            panneau = WebDriverWait(driver, WAIT_SEC).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, sel))
            )
            break
        except TimeoutException:
            continue
    if not panneau:
        return liens

    tries_sans_nouveau, last_count = 0, 0
    while tries_sans_nouveau < MAX_SCROLL_TRIES and len(liens) < nb_cible:
        elements = driver.find_elements(By.CSS_SELECTOR, "div.Nv2PK")
        for elem in elements:
            try:
                a = elem.find_element(By.CSS_SELECTOR, "a")
                url = (a.get_attribute("href") or "").strip()
                if not url or "maps/place" not in url or url in vus:
                    continue
                nom = ""
                for sel in [".qBF1Pd", ".fontHeadlineSmall", "span.fontBodyMedium"]:
                    try:
                        txt = elem.find_element(By.CSS_SELECTOR, sel).text.strip()
                        if txt and txt != "Résultats":
                            nom = txt
                            break
                    except Exception:
                        pass
                vus.add(url)
                liens.append({"url": url, "nom_apercu": nom})
                if len(liens) >= nb_cible:
                    break
            except (StaleElementReferenceException, Exception):
                continue

        try:
            driver.execute_script(
                "arguments[0].scrollTop = arguments[0].scrollHeight", panneau
            )
        except Exception:
            pass
        time.sleep(SCROLL_PAUSE_SEC)

        new_count = len(driver.find_elements(By.CSS_SELECTOR, "div.Nv2PK"))
        if new_count <= last_count:
            tries_sans_nouveau += 1
        else:
            tries_sans_nouveau = 0
            last_count = new_count

    return liens[:nb_cible]


# ── Étape 2 : Extraire une fiche ──────────────────────────
def extraire_fiche(driver, url: str, nom_apercu: str = "", source: str = "maps_fr") -> dict:
    fiche = {
        "source":    source,
        "nom":       nom_apercu,
        "categorie": "",
        "adresse":   "",
        "telephone": "",
        "site_web":  "",
        "note":      "",
        "nb_avis":   "",
        "prix":      "",
        "surface":   "",
        "pieces":    "",
        "description": "",
        "url":       url,
        "date":      "",
    }
    ok = False
    for _ in range(RETRIES_PER_URL + 1):
        try:
            driver.get(url)
            WebDriverWait(driver, WAIT_SEC).until(
                lambda d: d.find_elements(By.CSS_SELECTOR, "h1.DUwDvf")
                or d.find_elements(By.CSS_SELECTOR, "h1")
            )
            ok = True
            break
        except (TimeoutException, WebDriverException):
            continue
    if not ok:
        return fiche

    # Nom
    for sel in ["h1.DUwDvf", "h1.fontHeadlineLarge", "h1"]:
        try:
            txt = driver.find_element(By.CSS_SELECTOR, sel).text.strip()
            if txt and txt != "Résultats":
                fiche["nom"] = txt
                break
        except Exception:
            pass

    # Catégorie
    for sel in ["button.DkEaL", "button.skqShb", "span.YhemCb"]:
        try:
            txt = driver.find_element(By.CSS_SELECTOR, sel).text.strip()
            if txt:
                fiche["categorie"] = txt
                break
        except Exception:
            pass

    # Adresse
    for sel in [
        "button[data-item-id='address'] .Io6YTe",
        "button[aria-label*='Adresse'] .Io6YTe",
        "[data-item-id='address'] .Io6YTe",
    ]:
        try:
            txt = driver.find_element(By.CSS_SELECTOR, sel).text.strip()
            if txt:
                fiche["adresse"] = txt
                break
        except Exception:
            pass

    # Téléphone
    for sel in [
        "button[data-item-id^='phone'] .Io6YTe",
        "button[aria-label*='Appeler'] .Io6YTe",
    ]:
        try:
            txt = driver.find_element(By.CSS_SELECTOR, sel).text.strip()
            if txt:
                fiche["telephone"] = txt
                break
        except Exception:
            pass
    if not fiche["telephone"]:
        try:
            texte = driver.find_element(By.TAG_NAME, "body").text
            m = re.search(r"(?:(?:\+33|\+32|0033|0032|0)[1-9])(?:[\s\.\-]?\d{2}){4}", texte)
            if m:
                fiche["telephone"] = m.group().strip()
        except Exception:
            pass

    # Site web
    for sel in ["a[data-item-id='authority']", "a[aria-label*='site']"]:
        try:
            href = driver.find_element(By.CSS_SELECTOR, sel).get_attribute("href") or ""
            if href and "google" not in href and "maps" not in href:
                fiche["site_web"] = href.strip()
                break
        except Exception:
            pass

    # Note (information, pas filtre)
    try:
        note_el = driver.find_element(By.CSS_SELECTOR, ".MW4etd")
        fiche["note"] = note_el.text.strip()
    except Exception:
        pass

    # Nb avis
    try:
        texte = driver.find_element(By.TAG_NAME, "body").text
        m = re.search(r"([\d\s]+)\s+avis", texte)
        if m:
            fiche["nb_avis"] = m.group(1).strip().replace("\xa0", "")
    except Exception:
        pass

    return fiche


# ── Point d'entrée async ──────────────────────────────────
async def run_maps_scraper(params, progress_cb, save_cb):
    source = f"maps_{params.pays.lower()}"
    url = build_maps_url(params.secteur, params.localisation, params.pays)

    driver = await asyncio.to_thread(init_driver)
    try:
        await asyncio.to_thread(driver.get, url)
        await asyncio.sleep(1.2)

        # Accepter cookies
        await asyncio.to_thread(
            try_click,
            driver,
            ["button[aria-label*='Accepter']", "button[aria-label*='Accept']",
             "#L2AGLb", "button.tHlp8d"],
            3.5,
        )
        await asyncio.sleep(0.8)

        # Collecter liens
        await progress_cb(0, params.nb_results, "Collecte des fiches...")
        liens = await asyncio.to_thread(collecter_liens, driver, params.nb_results)
        total = len(liens)

        # Extraire chaque fiche
        done = 0
        for item in liens:
            fiche = await asyncio.to_thread(
                extraire_fiche, driver, item["url"], item["nom_apercu"], source
            )
            # Filtres
            if params.avec_telephone and not fiche["telephone"]:
                done += 1
                await progress_cb(done, total, f"Filtré (pas de tél) : {fiche['nom']}")
                continue
            if params.avec_site and not fiche["site_web"]:
                done += 1
                await progress_cb(done, total, f"Filtré (pas de site) : {fiche['nom']}")
                continue
            await save_cb(fiche)
            done += 1
            await progress_cb(done, total, fiche["nom"])
    finally:
        await asyncio.to_thread(driver.quit)
