#!/usr/bin/env python3
"""For each broken slug, try common alternatives via Wikipedia search and redirects."""
import json
import sys
import time
import urllib.parse
import urllib.request

UA = "CarDB-image-sweep/1.0 (barker5669@gmail.com)"
sys.stdout.reconfigure(encoding="utf-8")

def http_json(url, max_retries=5):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    backoff = 1.0
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.loads(r.read().decode("utf-8")), r.status
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < max_retries - 1:
                time.sleep(backoff)
                backoff *= 2
                continue
            return None, e.code
        except Exception:
            if attempt < max_retries - 1:
                time.sleep(backoff)
                backoff *= 2
                continue
            return None, -1
    return None, -1

def get_summary(title):
    """Resolve title via REST summary, returns (resolved_title, thumbnail_source) or (None, None)."""
    url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title, safe="")
    data, status = http_json(url)
    if status != 200 or not data:
        return None, None, status
    thumb = data.get("thumbnail", {}).get("source")
    canon = data.get("titles", {}).get("canonical") or data.get("title")
    return canon, thumb, status

def search(query, limit=5):
    url = (
        "https://en.wikipedia.org/w/api.php?action=query&format=json&list=search"
        "&srsearch=" + urllib.parse.quote(query)
        + f"&srlimit={limit}&srprop=snippet"
    )
    data, status = http_json(url)
    if not data:
        return []
    return [hit["title"] for hit in data.get("query", {}).get("search", [])]

def candidates_for(slug, car_names):
    """Generate ordered candidate page-titles for a broken slug."""
    cands = []
    # 1. Replace _(car) variations
    if slug.endswith("_(car)"):
        cands.append(slug[:-len("_(car)")])
    if slug.endswith("_(automobile)"):
        cands.append(slug[:-len("_(automobile)")])
    # 2. Strip parenthetical
    import re as _re
    no_paren = _re.sub(r"_\([^)]*\)$", "", slug)
    if no_paren != slug:
        cands.append(no_paren)
    # 3. Title without underscores via search
    base = slug.replace("_", " ")
    cands.append(base)
    # 4. Use car names
    for c in car_names:
        cands.append(c)
    # Dedup preserving order
    seen = set()
    uniq = []
    for c in cands:
        if c not in seen:
            seen.add(c)
            uniq.append(c)
    return uniq

def main():
    with open(r"C:\Users\barke\PycharmProjects\CarDB\broken_slugs.json", encoding="utf-8") as f:
        d = json.load(f)
    broken = d["broken"]
    suggestions = []
    for entry in broken:
        slug = entry["slug"]
        cars = entry["cars"]
        cands = candidates_for(slug, cars)
        chosen = None
        chosen_title = None
        chosen_thumb = None
        notes = []
        for cand in cands:
            title, thumb, status = get_summary(cand)
            notes.append(f"  try {cand!r} -> status={status} title={title!r} thumb={'yes' if thumb else 'no'}")
            if thumb:
                chosen = cand
                chosen_title = title
                chosen_thumb = thumb
                break
        if not chosen:
            # try search api
            for q in [slug.replace("_", " ")] + cars[:2]:
                hits = search(q, limit=5)
                notes.append(f"  search {q!r} -> {hits}")
                for h in hits:
                    title, thumb, status = get_summary(h.replace(" ", "_"))
                    notes.append(f"    try {h!r} -> status={status} thumb={'yes' if thumb else 'no'}")
                    if thumb:
                        chosen = h.replace(" ", "_")
                        chosen_title = title
                        chosen_thumb = thumb
                        break
                if chosen:
                    break
        suggestions.append({
            "old_slug": slug,
            "cars": cars,
            "new_slug": chosen,
            "new_title": chosen_title,
            "thumbnail": chosen_thumb,
            "notes": notes,
        })
        print(f"{slug!r} -> {chosen!r}  (cars: {cars})")
        for n in notes:
            print(n)
        print()
    with open(r"C:\Users\barke\PycharmProjects\CarDB\suggestions.json", "w", encoding="utf-8") as f:
        json.dump(suggestions, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
