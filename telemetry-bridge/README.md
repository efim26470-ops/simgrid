# SimGrid Telemetry Bridge

This folder provides a neutral import layer for completed sessions.

## CSV conversion

```bash
python simgrid_bridge.py convert laps.csv --game acc --track spa --car m4gt3
```

Import the generated `.simgrid.json` in the iOS PWA.

Recognized time-column names include `lap_time`, `laptime`, `time`, `lap time`, and `currentlaptime`.

## HTTP inbox for SimHub or another PC tool

```bash
python simgrid_bridge.py serve
```

Send a completed session as JSON:

```bash
curl -X POST http://127.0.0.1:8765/ingest \
  -H "Content-Type: application/json" \
  --data @example-session.json
```

Download `http://127.0.0.1:8765/latest` on the PC and transfer it to the iPhone with AirDrop/iCloud, then import it in SimGrid.

Direct access to shared memory, `.ibt` files and game UDP must run on the gaming PC. GitHub Pages and iOS Safari cannot read those PC resources directly.
