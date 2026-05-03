#!/usr/bin/env python3
"""Search Wikimedia Commons for files matching specific car queries."""
import json, sys, time, urllib.parse, urllib.request
sys.stdout.reconfigure(encoding="utf-8")

UA = "CarDB-image-sweep/1.0 (barker5669@gmail.com)"

def commons_search(query, limit=5):
    url = ("https://commons.wikimedia.org/w/api.php?action=query&format=json"
           "&generator=search&gsrnamespace=6&gsrsearch="
           + urllib.parse.quote(query)
           + f"&gsrlimit={limit}&prop=imageinfo&iiprop=url&iiurlwidth=640")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    backoff = 1.0
    for _ in range(5):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                d = json.loads(r.read().decode("utf-8"))
            pages = d.get("query", {}).get("pages", {}) or {}
            results = []
            for p in pages.values():
                ii = (p.get("imageinfo") or [{}])[0]
                title = p.get("title")
                thumb = ii.get("thumburl")
                full = ii.get("url")
                results.append({"title": title, "thumb": thumb, "full": full})
            return results
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(backoff); backoff *= 2; continue
            return []
        except Exception:
            time.sleep(backoff); backoff *= 2
    return []

queries = [
    "Aston Martin Ulster 1934",
    "Aston Martin Le Mans 1933",
    "Aston Martin Lagonda Series 2",
    "Talbot-Lago T150 SS Teardrop",
    "Alfa Romeo 8C 2300 Monza",
    "Alfa Romeo 8C 2900",
    "Alfa Romeo 6C 1750",
    "Alfa Romeo 6C 2300",
    "Alfa Romeo Tipo 33/3",
    "Packard Twelve",
    "Ferrari 330 GTC",
    "Ferrari 250 GT Tour de France",
    "Ferrari 412 GT",
    "Honda Beat PP1",
    "BMW Z3 M Coupe",
    "BMW M3 CSL",
    "Westfield SEight",
    "HRG 1500",
    "Sunbeam 3-Litre Twin Cam",
    "Frazer Nash TT Replica",
    "Pontiac GTO 1965",
    "Renault Alpine GTA V6 Turbo",
    "Renault GTA V6 Turbo",
    "Audi Sport Quattro",
    "Aston Martin DBS 1969",
    "Bentley R-Type Continental",
    "Cisitalia 202",
    "Maserati Ghibli 1969",
    "Mazda RX-7 SA22C",
    "Marcos GT 1968",
    "Mini Cooper R53",
    "Pontiac GTO 1966",
    "Talbot Lago Record T26",
]
for q in queries:
    print(f"\n== {q!r}")
    rs = commons_search(q, 3)
    for r in rs[:3]:
        print(f"   {r['title']}  thumb={r['thumb']}")
