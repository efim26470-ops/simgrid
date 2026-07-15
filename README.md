# SimGrid PWA v2.3.0

Local-first iOS/desktop manager for sim-racing sessions, setups, strategy and track training. The project is fully static and deploys directly to GitHub Pages without a build step.

## Track Academy Pro

- 14 expanded track guides with key zones, braking references, entry-speed orientation, apex type, throttle phase and curb usage
- qualifying, race, wet and defensive training modes
- visual telemetry references for brake, throttle and steering input
- persistent training checklists and progress per track
- five-question mini tests with saved results
- a local raster cover and a separate circuit diagram for all 26 guides; no external image host is required

Braking distances and speeds are starting references rather than universal targets. They vary by simulator, car, setup, fuel, tyres, assists, weather and track conditions.

## Setup Garage Pro

- personal garage plus a built-in library of 20 starter setups
- filters by simulator, track, weather, text and favorites
- dry, wet, hot and mixed-condition profiles
- ratings, tags, notes and temperature
- setup analysis for aero balance, mechanical balance, rake/platform, brake balance and tyre pressure
- extended parameters: camber, toe and power/coast differential
- version history with rollback
- favorites, library copying and side-by-side comparison

## Other features

- Assetto Corsa, ACC, iRacing, F1, Assetto Corsa EVO, rFactor 2, Le Mans Ultimate, Automobilista 2 and RaceRoom
- local session journal, lap series, personal records and consistency calculation
- Live Activity-like session timer
- strategy calculator with fuel, tyre life, pit loss and multiple variants
- Sprint, Endurance, Formula and Drift profiles
- eight visual themes
- JSON backup, CSV export and JSON/CSV import
- offline service worker and iOS Home Screen metadata
- optional Steam Worker and PC telemetry bridge

## GitHub Pages deployment

1. Upload the **contents** of this folder to the repository root.
2. Open **Settings в†’ Pages**.
3. Select **Deploy from a branch**, branch `main`, folder `/root`.
4. Open the published URL once in Safari.
5. On iPhone use **Share в†’ Add to Home Screen**.

The v2 service worker uses cache `simgrid-v2.3.0`. When replacing an older version, open the site once in Safari before reopening the Home Screen app so the new worker can activate.

## Steam and telemetry

A GitHub Pages project must not expose a Steam Web API key. Deploy the optional worker from `steam-worker/` and enter its address inside SimGrid. Steam can provide profile and library information, but it does not store lap telemetry or setup parameters. Session telemetry is imported through `telemetry-bridge/` or compatible JSON/CSV files.

## Privacy

Sessions, setup versions, favorites, guide progress and quiz results are stored locally in browser storage. Export a JSON backup before clearing Safari website data or moving to another device.

## v2.2.0 вЂ” macOS/iOS visual fix

- РџРµСЂРµСЃРѕР±СЂР°РЅ РєР°С‚Р°Р»РѕРі С‚СЂР°СЃСЃ Рё РјР°С€РёРЅ: РЅРѕРІС‹Рµ РєР°СЂС‚РѕС‡РєРё, С„РёР»СЊС‚СЂ РїРѕ С‚РёРїСѓ С‚СЂР°СЃСЃС‹ / РєР»Р°СЃСЃСѓ РјР°С€РёРЅС‹, СѓР»СѓС‡С€РµРЅРЅС‹Рµ СЃС…РµРјС‹, СЃС‚Р°СЂС‚РѕРІС‹Рµ С‚РѕС‡РєРё Рё СЂРµР№С‚РёРЅРі СЃР»РѕР¶РЅРѕСЃС‚Рё.
- РСЃРїСЂР°РІР»РµРЅР° РІРёР·СѓР°Р»СЊРЅР°СЏ РїСЂРѕР±Р»РµРјР° СЃ РѕРґРёРЅР°РєРѕРІРѕР№ РєСЂР°СЃРЅРѕР№ С‚РѕС‡РєРѕР№ РЅР° С‚СЂР°СЃСЃР°С…: СЃС‚Р°СЂС‚ С‚РµРїРµСЂСЊ РІС‹С‡РёСЃР»СЏРµС‚СЃСЏ РёР· SVG-РїСѓС‚Рё.
- РћР±РЅРѕРІР»РµРЅС‹ РјРѕРґР°Р»СЊРЅС‹Рµ РѕРєРЅР° РґР»СЏ macOS Рё iOS: Р°РєРєСѓСЂР°С‚РЅС‹Рµ РѕС‚СЃС‚СѓРїС‹, СЃС‚Р°Р±РёР»СЊРЅР°СЏ РїСЂРѕРєСЂСѓС‚РєР°, safe-area Рё РЅРёР¶РЅРёРµ РґРµР№СЃС‚РІРёСЏ.
- Р”РѕР±Р°РІР»РµРЅС‹ Р±РѕР»РµРµ Р·Р°РјРµС‚РЅС‹Рµ Р°РЅРёРјР°С†РёРё РїРѕСЏРІР»РµРЅРёСЏ РєР°СЂС‚РѕС‡РµРє, РѕС‚СЂРёСЃРѕРІРєРё С‚СЂРµРєР°, РѕС‚РєСЂС‹С‚РёСЏ РјРѕРґР°Р»СЊРЅРѕРіРѕ РѕРєРЅР° Рё hover/active-СЃРѕСЃС‚РѕСЏРЅРёСЏ.
- Р Р°СЃС€РёСЂРµРЅС‹ РґРµС‚Р°Р»Рё РєР°С‚Р°Р»РѕРіР°: С‚СЂРµРЅРёСЂРѕРІРѕС‡РЅС‹Р№ РїР»Р°РЅ РґР»СЏ С‚СЂР°СЃСЃС‹ Рё РёРЅР¶РµРЅРµСЂРЅР°СЏ РїРѕРґСЃРєР°Р·РєР° РґР»СЏ Р°РІС‚РѕРјРѕР±РёР»СЏ.

## v2.2.1 вЂ” guide modal fix

- РћР±Р»РѕР¶РєРё РєР°СЂС‚РѕС‡РµРє Р±РѕР»СЊС€Рµ РЅРµ РѕР±СЂРµР·Р°СЋС‚СЃСЏ Рё РЅРµ РґСѓР±Р»РёСЂСѓСЋС‚ С‚РµРєСЃС‚ РІРЅСѓС‚СЂРё РјРѕРґР°Р»СЊРЅРѕРіРѕ РіР°Р№РґР°.
- РЈС‚РѕС‡РЅРµРЅС‹ РґРёРЅР°РјРёС‡РµСЃРєР°СЏ РІС‹СЃРѕС‚Р°, safe-area, Р·Р°РіРѕР»РѕРІРѕРє Рё РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅРѕРµ РїРµСЂРµРїРѕР»РЅРµРЅРёРµ РјРѕРґР°Р»СЊРЅС‹С… РѕРєРѕРЅ РЅР° macOS/iOS.
- РћР±РЅРѕРІР»РµРЅР° РІРµСЂСЃРёСЏ PWA-РєСЌС€Р°, С‡С‚РѕР±С‹ СѓСЃС‚Р°РЅРѕРІР»РµРЅРЅРѕРµ РїСЂРёР»РѕР¶РµРЅРёРµ РїРѕР»СѓС‡РёР»Рѕ РІРёР·СѓР°Р»СЊРЅС‹Рµ РёСЃРїСЂР°РІР»РµРЅРёСЏ.

## v2.3.0 вЂ” clear Track Academy

- РЈ РІСЃРµС… 26 РіР°Р№РґРѕРІ С‚РµРїРµСЂСЊ РµСЃС‚СЊ Р»РѕРєР°Р»СЊРЅР°СЏ СЂР°СЃС‚СЂРѕРІР°СЏ РѕР±Р»РѕР¶РєР° Рё РѕС‚РґРµР»СЊРЅР°СЏ СЃС…РµРјР° С‚СЂР°СЃСЃС‹.
- Р”Р»СЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СЃРѕР·РґР°РЅРЅС‹С… РіР°Р№РґРѕРІ РґРѕР±Р°РІР»РµРЅС‹ СЂРµР°Р»СЊРЅС‹Рµ РЅР°Р·РІР°РЅРёСЏ РєР»СЋС‡РµРІС‹С… Р·РѕРЅ Рё РїРѕРЅСЏС‚РЅС‹Рµ РґРµР№СЃС‚РІРёСЏ РїРѕ РїРѕСЂСЏРґРєСѓ.
- РќРѕРІС‹Р№ СЃС†РµРЅР°СЂРёР№ С‚СЂРµРЅРёСЂРѕРІРєРё: С‚СЂРё СЂР°Р·РјРёРЅРѕС‡РЅС‹С… РєСЂСѓРіР°, РѕРґРЅР° Р·РѕРЅР° С„РѕРєСѓСЃР° Рё СЃРµСЂРёСЏ РёР· РїСЏС‚Рё С‡РёСЃС‚С‹С… РєСЂСѓРіРѕРІ.
- РџРµСЂРµСЃРѕР±СЂР°РЅС‹ РєР°СЂС‚РѕС‡РєРё Рё РјРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ РґР»СЏ СЂРѕРІРЅРѕР№ СЃРµС‚РєРё РЅР° macOS, iPad Рё iPhone.
- РЈР±СЂР°РЅР° РїРµСЂРµРіСЂСѓР¶РµРЅРЅР°СЏ С‚РµР»РµРјРµС‚СЂРёС‡РµСЃРєР°СЏ РІРёР·СѓР°Р»РёР·Р°С†РёСЏ РёР· РѕСЃРЅРѕРІРЅРѕРіРѕ СЂР°Р·Р±РѕСЂР° Р·РѕРЅ.
