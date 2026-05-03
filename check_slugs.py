#!/usr/bin/env python3
"""Check Wikipedia slugs in WIKI_PAGES of cars.js for missing thumbnails."""
import json
import re
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

CARS_JS = r"C:\Users\barke\PycharmProjects\CarDB\js\cars.js"

def parse_wiki_pages(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    # Find the WIKI_PAGES block
    m = re.search(r"const WIKI_PAGES = \{([\s\S]*?)\n\};", text)
    body = m.group(1)
    entries = []  # list of (car_name, value, line_text)
    for line in body.splitlines():
        # match keys like 'Foo': 'Bar' or "Foo": "Bar"
        # values may have https:// or be slugs
        mm = re.match(r"\s*(['\"])(.*?)\1\s*:\s*(['\"])(.*?)\3\s*,?\s*(//.*)?$", line)
        if mm:
            entries.append((mm.group(2), mm.group(4), line))
    return entries

import time

def fetch(slug, max_retries=5):
    url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(slug, safe="")
    req = urllib.request.Request(url, headers={"User-Agent": "CarDB-image-sweep/1.0 (barker5669@gmail.com)"})
    backoff = 1.0
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                data = json.loads(r.read().decode("utf-8"))
            thumb = data.get("thumbnail", {}).get("source")
            title = data.get("title")
            redirect = data.get("titles", {}).get("canonical")
            return {"slug": slug, "status": r.status, "thumb": thumb, "title": title, "canonical": redirect}
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < max_retries - 1:
                time.sleep(backoff)
                backoff *= 2
                continue
            return {"slug": slug, "status": e.code, "thumb": None, "title": None, "error": str(e)}
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(backoff)
                backoff *= 2
                continue
            return {"slug": slug, "status": -1, "thumb": None, "title": None, "error": str(e)}
    return {"slug": slug, "status": -1, "thumb": None, "title": None, "error": "exhausted retries"}

def main():
    entries = parse_wiki_pages(CARS_JS)
    # collect unique slug values (skip http URLs)
    slug_to_cars = {}
    for car, val, _line in entries:
        if val.startswith("https://"):
            continue
        slug_to_cars.setdefault(val, []).append(car)
    print(f"Total entries: {len(entries)}")
    print(f"Unique slugs to check: {len(slug_to_cars)}")
    results = {}
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(fetch, s): s for s in slug_to_cars}
        for f in as_completed(futs):
            r = f.result()
            results[r["slug"]] = r
    # Build broken list
    broken = []
    for slug, info in sorted(results.items()):
        if not info.get("thumb"):
            broken.append({
                "slug": slug,
                "status": info.get("status"),
                "title": info.get("title"),
                "canonical": info.get("canonical"),
                "error": info.get("error"),
                "cars": slug_to_cars[slug],
            })
    out = {
        "total_entries": len(entries),
        "total_unique_slugs": len(slug_to_cars),
        "broken_count": len(broken),
        "broken": broken,
    }
    with open(r"C:\Users\barke\PycharmProjects\CarDB\broken_slugs.json", "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"Broken slugs (no thumbnail): {len(broken)}")
    for b in broken:
        print(f"  {b['slug']!r}  status={b['status']}  cars={b['cars']}")

if __name__ == "__main__":
    main()
