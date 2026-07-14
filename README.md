# SimGrid PWA

Local-first manager for sim-racing sessions, setups, strategy and track guides. Designed for iPhone Home Screen and desktop browsers.

## Included

- Assetto Corsa, ACC, iRacing, EA SPORTS F1, Assetto Corsa EVO and custom games
- session journal with lap series, best/average lap and consistency calculation
- Live Activity-like session timer
- fuel, tyre and pit-stop strategy calculator with four variants
- setup storage and side-by-side comparison
- progress chart and personal records
- 19 tracks, 30 cars and 8 detailed track guides
- Sprint, Endurance, Formula and Drift profiles
- 8 complete visual themes
- JSON backup, CSV export and JSON/CSV import
- offline service worker, iOS icons and install metadata
- optional Steam Worker and PC telemetry bridge

## GitHub Pages deployment

1. Create a repository, for example `simgrid`.
2. Upload the **contents** of this folder to the repository root.
3. Open **Settings → Pages**.
4. Select **Deploy from a branch**, branch `main`, folder `/root`.
5. Open `https://USERNAME.github.io/simgrid/`.
6. On iPhone in Safari: **Share → Add to Home Screen**.

No build step is required.

## Steam integration

A static GitHub Pages site must not contain a Steam Web API key. Deploy the optional file in `steam-worker/` and enter its URL in **Ещё → Steam Connector**.

Steam sync imports profile information, owned racing games, playtime and recent games. Steam does not store racing telemetry. Lap data is imported through the included `telemetry-bridge/` or a compatible CSV/JSON export.

## Data privacy

All sessions and setups are stored in the browser's local storage. Export a JSON backup before clearing Safari website data or changing devices.

## Guide images

Guide cover images load from Unsplash on first view and are then cached by the service worker. Circuit diagrams and trajectory schematics are bundled in the application code. See `CREDITS.md`.
