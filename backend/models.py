from pydantic import BaseModel
from typing import Optional


class MapsParams(BaseModel):
    secteur: str
    localisation: str          # "Paris" | "75" (département) | "75001" (CP)
    pays: str = "FR"           # "FR" | "BE"
    nb_results: int = 20
    avec_telephone: bool = True
    avec_site: bool = False


class LeboncoinParams(BaseModel):
    keywords: str
    localisation: str
    categorie_id: int = 9      # 9 = Immobilier ventes
    prix_min: Optional[int] = None
    prix_max: Optional[int] = None
    type_vendeur: str = "all"  # "all" | "private" | "professional"
    nb_results: int = 50


class PapParams(BaseModel):
    localisation: str          # ville, CP 75001 ou département 75
    type_bien: str = "ventes"  # "ventes" | "locations"
    prix_max: Optional[int] = None
    pieces_min: Optional[int] = None
    nb_results: int = 50


class ScrapeRequest(BaseModel):
    source: str                # "maps_fr" | "maps_be" | "leboncoin" | "pap"
    maps: Optional[MapsParams] = None
    leboncoin: Optional[LeboncoinParams] = None
    pap: Optional[PapParams] = None


class Lead(BaseModel):
    source: str
    nom: str = ""
    categorie: str = ""
    adresse: str = ""
    telephone: str = ""
    site_web: str = ""
    note: str = ""
    nb_avis: str = ""
    prix: str = ""
    surface: str = ""
    pieces: str = ""
    description: str = ""
    url: str = ""
    date: str = ""


class JobStatus(BaseModel):
    id: str
    source: str
    status: str                # "pending" | "running" | "done" | "error"
    progress: int = 0
    total: int = 0
    message: str = ""
    created_at: str = ""
