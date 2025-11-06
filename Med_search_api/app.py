"""
AI Web Search API for Medicine Deals
-----------------------------------

Dependencies (install):
    pip install fastapi uvicorn httpx pydantic python-dotenv

Environment variables (.env or system):
    GOOGLE_API_KEY=your_google_api_key
    GOOGLE_CX=your_custom_search_engine_id
    SERPAPI_API_KEY=your_serpapi_key   # optional; enables Shopping offers

Run (dev):
    uvicorn ai_medicine_search_api:app --reload --port 8000

Endpoints:
    POST /search        -> {"query": "paracetamol 500 mg"}
    POST /search_bulk   -> {"queries": ["paracetamol 500 mg", "ibuprofen 200 mg"]}
"""

from __future__ import annotations

import os
import re
from typing import List, Optional, Dict, Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # ← ADD THIS
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# ------------------------
# CORS FIX - ALLOW NEXT.JS (localhost:3000)
# ------------------------
app = FastAPI(title="AI Medicine Web Search API", version="1.0.0")

# ADD THIS BLOCK - CORS MIDDLEWARE
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Add your production domain later:
        # "https://yourapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows POST, GET, OPTIONS
    allow_headers=["*"],
)

# ------------------------
# Config
# ------------------------
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CX = os.getenv("GOOGLE_CX")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0 Safari/537.36"
)

# ------------------------
# Schemas
# ------------------------
class Offer(BaseModel):
    title: str
    price: Optional[float] = None
    currency: Optional[str] = None
    seller: Optional[str] = None
    link: str
    source: str = Field(default="google")

class SearchResponse(BaseModel):
    query: str
    best_offer: Optional[Offer] = None
    offers: List[Offer] = Field(default_factory=list)

class QueryBody(BaseModel):
    query: str = Field(..., description="Medicine name and spec, e.g., 'paracetamol 500 mg 10 tablets'")

class BulkQueryBody(BaseModel):
    queries: List[str]

# ------------------------
# Utils
# ------------------------
PRICE_REGEX = re.compile(r"(?i)(₹|rs\.?|inr|\$|usd|€|eur|£|gbp)\s*([0-9]+(?:[\.,][0-9]{2})?)")
CURRENCY_MAP = {
    "₹": "INR",
    "rs": "INR",
    "inr": "INR",
    "$": "USD",
    "usd": "USD",
    "€": "EUR",
    "eur": "EUR",
    "£": "GBP",
    "gbp": "GBP",
}

def parse_price(text: str) -> tuple[Optional[float], Optional[str]]:
    if not text:
        return None, None
    m = PRICE_REGEX.search(text.replace(",", ""))
    if not m:
        return None, None
    sym = m.group(1).lower()
    amt = m.group(2)
    try:
        value = float(amt)
    except Exception:
        value = None
    currency = CURRENCY_MAP.get(sym, None)
    return value, currency


def choose_best(offers: List[Offer]) -> Optional[Offer]:
    priced = [o for o in offers if o.price is not None]
    if not priced:
        return offers[0] if offers else None
    priced.sort(key=lambda o: o.price)
    return priced[0]

# ------------------------
# Providers
# ------------------------
async def search_serpapi_shopping(query: str) -> List[Offer]:
    if not SERPAPI_API_KEY:
        return []
    params = {
        "engine": "google_shopping",
        "q": query,
        "api_key": SERPAPI_API_KEY,
        "hl": "en",
        "gl": "in",
    }
    url = "https://serpapi.com/search.json"
    async with httpx.AsyncClient(timeout=60, headers={"User-Agent": USER_AGENT}) as client:
        r = await client.get(url, params=params)
    if r.status_code != 200:
        return []
    data = r.json()
    products = data.get("shopping_results", []) or data.get("organic_results", [])
    offers: List[Offer] = []
    for item in products:
        title = item.get("title") or item.get("name") or query
        link = item.get("link") or item.get("product_link") or item.get("source") or ""
        store = item.get("source") or item.get("seller")
        price_str = item.get("price") or item.get("extracted_price")
        price_val: Optional[float] = None
        currency: Optional[str] = None
        if isinstance(price_str, (int, float)):
            price_val = float(price_str)
        elif isinstance(price_str, str):
            price_val, currency = parse_price(price_str)
        if not currency:
            currency = "INR"
        if link:
            offers.append(Offer(title=title, price=price_val, currency=currency, seller=store, link=link, source="serpapi"))
    return offers


async def search_google_cse(query: str) -> List[Offer]:
    if not (GOOGLE_API_KEY and GOOGLE_CX):
        return []
    params = {
        "key": GOOGLE_API_KEY,
        "cx": GOOGLE_CX,
        "q": query + " buy price",
        "gl": "in",
        "hl": "en",
        "num": 10,
    }
    url = "https://www.googleapis.com/customsearch/v1"
    async with httpx.AsyncClient(timeout=20, headers={"User-Agent": USER_AGENT}) as client:
        r = await client.get(url, params=params)
    if r.status_code != 200:
        return []
    data = r.json()
    items = data.get("items", [])
    offers: List[Offer] = []
    for it in items:
        title = it.get("title", "")
        link = it.get("link", "")
        snippet = it.get("snippet", "")
        display_link = it.get("displayLink", "")
        price, currency = parse_price(snippet + " " + title)
        offers.append(
            Offer(
                title=title,
                price=price,
                currency=currency,
                seller=display_link,
                link=link,
                source="google_cse",
            )
        )
    return offers


async def aggregate_offers(query: str) -> SearchResponse:
    offers: List[Offer] = []
    serpapi_offers = await search_serpapi_shopping(query)
    cse_offers = await search_google_cse(query)
    offers.extend(serpapi_offers)
    seen: set[str] = set()
    unique_offers = []
    for o in offers:
        if o.link not in seen:
            unique_offers.append(o)
            seen.add(o.link)
    for o in cse_offers:
        if o.link not in seen:
            unique_offers.append(o)
            seen.add(o.link)
    best = choose_best(unique_offers)
    return SearchResponse(query=query, best_offer=best, offers=unique_offers)

# ------------------------
# API
# ------------------------
@app.post("/search", response_model=SearchResponse)
async def search(body: QueryBody):
    if not (SERPAPI_API_KEY or (GOOGLE_API_KEY and GOOGLE_CX)):
        raise HTTPException(status_code=500, detail="No search provider configured. Set SERPAPI_API_KEY or GOOGLE_API_KEY+GOOGLE_CX.")
    return await aggregate_offers(body.query)

@app.post("/search_bulk", response_model=List[SearchResponse])
async def search_bulk(body: BulkQueryBody):
    if not body.queries:
        return []
    if not (SERPAPI_API_KEY or (GOOGLE_API_KEY and GOOGLE_CX)):
        raise HTTPException(status_code=500, detail="No search provider configured. Set SERPAPI_API_KEY or GOOGLE_API_KEY+GOOGLE_CX.")
    results: List[SearchResponse] = []
    for q in body.queries:
        results.append(await aggregate_offers(q))
    return results

# ------------------------
# Health
# ------------------------
@app.get("/health")
async def health():
    providers: Dict[str, Any] = {
        "serpapi": bool(SERPAPI_API_KEY),
        "google_cse": bool(GOOGLE_API_KEY and GOOGLE_CX),
    }
    return {"status": "ok", "providers": providers}