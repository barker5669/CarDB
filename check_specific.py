#!/usr/bin/env python3
"""Verify specific candidate slugs and resolve canonical titles."""
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
        except Exception as e:
            time.sleep(backoff); backoff *= 2
    return None

# Tries
tries = [
    "Alfa_Romeo_Giulia_TI_Super",
    "Alfa_Romeo_Giulia_TI",
    "Alfa_Romeo_Giulia",
    "Alfa Romeo 33/3",
    "Alfa_Romeo_Tipo_33",
    "Alpine_A310",
    "Alpine_A610",
    "Renault_Alpine_GTA",
    "Aston_Martin_Le_Mans",
    "Aston_Martin_15-98",
    "Aston_Martin_Atom",
    "Aston_Martin_Ulster",
    "Aston_Martin_DBS",
    "Audi_Sport_Quattro",
    "Audi_quattro",
    "Audi_Quattro",
    "Bentley_R_Type",
    "Bristol_Fighter_(automobile)",
    "Facel_Vega",
    "Facel_Vega_FV",
    "Ferrari_250_GT_Tour_de_France",
    "Ferrari_250_GT_Berlinetta_Tour_de_France",
    "Ferrari_250",
    "Ferrari_330_GTC",
    "Ferrari_330_GT_2+2",
    "Ferrari_365_GT4_2+2,_400_and_412",
    "Ferrari_400",
    "Dino_(automobile)",
    "Dino_206_GT",
    "Jaguar_XJR_(X306)",
    "Jaguar_XJR_(X308)",
    "Jaguar_XJR_(X300)",
    "Jaguar_X300",
    "Jaguar_XJ_(X308)",
    "MG_MGA",
    "MG_MGB",
    "MG_M_Type",
    "MG_M-type",
    "Marcos_Mantis",
    "Maserati_Ghibli",
    "Packard_Twelve",
    "Pontiac_GTO",
    "Porsche_911_(991)",
    "Porsche_911",
    "TVR_Tuscan_Speed_Six",
    "Talbot-Lago_Lago_Record",
    "Turner_Sports_Cars",
    "Westfield_SEight",
    "Westfield_Sportscars",
    "BMW_M3_CSL",
    "BMW_M5",
    "BMW_M6",
    "BMW_M3",
    "BMW_Z3_M_Coupe",
    "BMW_Z3_M_Roadster",
    "BMW_Z3",
    "Aston_Martin_DBS",
    "Lonsdale_(automobile)",
    "Pontiac_GTO_(1964-1967)",
    "Pontiac_GTO_(first_generation)",
    "Cisitalia_202",
    "Mustang_SVT_Cobra",
    "Ford_Mustang_SVT_Cobra",
    "Mustang_Cobra_R",
    "DB_(car)",
    "DB_Le_Mans",
    "Aston_Martin_15/98",
    "Talbot-Lago_T150",
    "Alfa_Romeo_6C_2500",
    "Alfa_Romeo_6C",
    "Alfa_Romeo_8C",
    "Alfa_Romeo_8C_2900",
    "Alfa_Romeo_8C_2300",
    "Alfa_Romeo_2900",
    "Alfa_Romeo_Tipo_33_Stradale",
    "Alfa_Romeo_33_Stradale",
]

for t in tries:
    d = get_summary(t)
    if not d:
        print(t, "ERR", "no response")
        continue
    if "_error" in d:
        print(t, "ERR", d["_error"])
        continue
    canon = d.get("titles", {}).get("canonical")
    title = d.get("title")
    desc = d.get("description")
    has_thumb = bool(d.get("thumbnail", {}).get("source"))
    redirect = d.get("type")
    print(f"{t}  ->  canon={canon!r}  title={title!r}  desc={desc!r}  thumb={has_thumb}")
