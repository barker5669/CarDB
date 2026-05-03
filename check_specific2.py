#!/usr/bin/env python3
import json, sys, time, urllib.parse, urllib.request
sys.stdout.reconfigure(encoding="utf-8")
UA = "CarDB-image-sweep/1.0 (barker5669@gmail.com)"

def get_summary(title):
    url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title, safe="")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    backoff = 1.0
    for _ in range(5):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                d = json.loads(r.read().decode("utf-8"))
            return d
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(backoff); backoff *= 2; continue
            return {"_error": e.code}
        except Exception:
            time.sleep(backoff); backoff *= 2
    return None

def search(query, limit=5):
    url = ("https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch="
           + urllib.parse.quote(query) + f"&srlimit={limit}")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    backoff = 1.0
    for _ in range(5):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                d = json.loads(r.read().decode("utf-8"))
            return [hit["title"] for hit in d.get("query", {}).get("search", [])]
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(backoff); backoff *= 2; continue
            return []
        except Exception:
            time.sleep(backoff); backoff *= 2
    return []

queries = [
    ("Aston Martin Ulster prewar", None),
    ("Aston Martin 15/98", None),
    ("Aston Martin Le Mans 1932", None),
    ("Talbot Lago T150 SS Teardrop", None),
    ("Alfa Romeo 8C 2300", None),
    ("Alfa Romeo 8C 2900B", None),
    ("Alfa Romeo 6C 1750", None),
    ("Alfa Romeo 6C 2300", None),
    ("Alfa Romeo Tipo 33 racing car", None),
    ("Packard Twelve 1933", None),
    ("Ferrari 330 GTC coupe", None),
    ("Ferrari 250 GT Tour de France 1956", None),
    ("Honda Beat kei roadster", None),
    ("Marcos GT 1800", None),
    ("Marcos GT car", None),
    ("BMW Z3 M Coupe", None),
    ("BMW M3 CSL E46", None),
    ("Bentley R Type Continental", None),
    ("HRG 1500 sports car", None),
    ("Sunbeam 3 Litre 1924", None),
    ("Frazer Nash TT Replica 1932", None),
    ("Honda Civic Type R EK9 1997", None),
    ("Ferrari 412 1985", None),
    ("Ferrari 412 GT 1985", None),
    ("Renault Alpine GTA Turbo", None),
    ("MGA 1955 sports car", None),
    ("Audi Sport Quattro short wheelbase", None),
    ("Cisitalia 202 coupe", None),
    ("Lonsdale automobile", None),
    ("Pontiac GTO 1965 muscle car", None),
    ("Westfield SEight British kit car", None),
    ("Talbot-Lago Record T26", None),
    ("Westfield Sportscars manufacturer", None),
]
for q, _ in queries:
    hits = search(q, 5)
    print(f"\n== {q!r}")
    for h in hits[:5]:
        d = get_summary(h.replace(" ", "_"))
        if d and "_error" not in (d or {}):
            canon = d.get("titles", {}).get("canonical")
            thumb = bool(d.get("thumbnail", {}).get("source"))
            print(f"   {h!r} -> canon={canon!r} thumb={thumb}")
        else:
            print(f"   {h!r} -> ERROR")
