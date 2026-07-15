#!/usr/bin/env python3
"""SimGrid telemetry inbox and universal session converter.

Examples:
  python simgrid_bridge.py convert session.csv --game acc --track spa --car m4gt3
  python simgrid_bridge.py serve --port 8765

POST a completed JSON session to http://127.0.0.1:8765/ingest .
Then open http://127.0.0.1:8765/latest to download a file for SimGrid import.
"""
from __future__ import annotations
import argparse, csv, json, re, time
from dataclasses import dataclass, asdict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
INBOX = ROOT / "inbox"
INBOX.mkdir(exist_ok=True)

ALIASES = {
    "lap": ["lap", "lap_number", "lapnumber", "lap no", "lapno"],
    "time": ["lap_time", "laptime", "time", "lap time", "currentlaptime"],
    "valid": ["valid", "is_valid", "clean", "lapvalid", "invalid"],
}

@dataclass
class Session:
    date: str
    game: str
    track: str
    car: str
    sessionType: str = "Импорт телеметрии"
    config: str = ""
    weather: str = ""
    bestLap: str = ""
    averageLap: str = ""
    laps: int = 0
    cleanLaps: int = 0
    consistency: float = 0.0
    fuelStart: float = 0.0
    fuelEnd: float = 0.0
    tyreWear: float = 0.0
    notes: str = "Импортировано через SimGrid Bridge"
    lapTimes: list[str] | None = None


def parse_lap_ms(value: Any) -> float | None:
    if value is None: return None
    text = str(value).strip().replace(",", ".")
    if not text: return None
    try:
        if ":" not in text: return float(text) * 1000
        m, s = text.split(":", 1)
        return (float(m) * 60 + float(s)) * 1000
    except ValueError:
        return None


def format_lap(ms: float) -> str:
    minutes = int(ms // 60000)
    seconds = (ms - minutes * 60000) / 1000
    return f"{minutes}:{seconds:06.3f}"


def find_column(headers: list[str], key: str) -> str | None:
    normalized = {h.lower().strip(): h for h in headers}
    for alias in ALIASES[key]:
        if alias in normalized: return normalized[alias]
    return None


def consistency(values: list[float]) -> float:
    if len(values) < 2: return 0.0
    avg = sum(values) / len(values)
    variance = sum((v - avg) ** 2 for v in values) / len(values)
    std = variance ** 0.5
    return round(max(0.0, min(100.0, 100.0 - (std / avg * 100 * 12))), 1)


def convert_csv(path: Path, game: str, track: str, car: str) -> dict[str, Any]:
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.DictReader(fh))
    if not rows: raise ValueError("CSV has no rows")
    headers = list(rows[0])
    time_col = find_column(headers, "time")
    valid_col = find_column(headers, "valid")
    if not time_col: raise ValueError("No lap-time column found")
    laps: list[str] = []
    clean = 0
    values: list[float] = []
    for row in rows:
        ms = parse_lap_ms(row.get(time_col))
        if ms is None or ms <= 0: continue
        laps.append(format_lap(ms)); values.append(ms)
        raw_valid = str(row.get(valid_col, "true")).strip().lower() if valid_col else "true"
        if raw_valid not in {"0", "false", "invalid", "yes" if valid_col and "invalid" in valid_col.lower() else "__never__"}:
            clean += 1
    if not values: raise ValueError("No valid lap times found")
    session = Session(
        date=time.strftime("%Y-%m-%d"), game=game, track=track, car=car,
        bestLap=format_lap(min(values)), averageLap=format_lap(sum(values)/len(values)),
        laps=len(values), cleanLaps=clean, consistency=consistency(values), lapTimes=laps
    )
    return {"app":"SimGrid","schema":1,"session":asdict(session)}


def normalize_json(data: dict[str, Any]) -> dict[str, Any]:
    if "session" in data: return data
    lap_times = data.get("lapTimes") or data.get("laps") or []
    if lap_times and isinstance(lap_times[0], dict):
        lap_times = [x.get("time") or x.get("lapTime") for x in lap_times]
    values = [parse_lap_ms(v) for v in lap_times]
    values = [v for v in values if v is not None]
    session = {
        "date": data.get("date", time.strftime("%Y-%m-%d")),
        "game": data.get("game", "other"), "track": data.get("track", "spa"),
        "car": data.get("car", "roadcar"), "sessionType": data.get("sessionType", "Импорт телеметрии"),
        "config": data.get("config", ""), "weather": data.get("weather", ""),
        "bestLap": data.get("bestLap") or (format_lap(min(values)) if values else ""),
        "averageLap": data.get("averageLap") or (format_lap(sum(values)/len(values)) if values else ""),
        "laps": data.get("lapCount", len(values)), "cleanLaps": data.get("cleanLaps", len(values)),
        "consistency": data.get("consistency", consistency(values)),
        "fuelStart": data.get("fuelStart", 0), "fuelEnd": data.get("fuelEnd", 0),
        "tyreWear": data.get("tyreWear", 0), "notes": data.get("notes", "Импортировано через SimGrid Bridge"),
        "lapTimes": [format_lap(v) for v in values]
    }
    return {"app":"SimGrid","schema":1,"session":session}


def save_payload(payload: dict[str, Any]) -> Path:
    path = INBOX / f"session-{int(time.time())}.simgrid.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    (INBOX / "latest.simgrid.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


class Handler(BaseHTTPRequestHandler):
    def _headers(self, status=200, content_type="application/json; charset=utf-8"):
        self.send_response(status); self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Cache-Control", "no-store"); self.end_headers()
    def do_OPTIONS(self):
        self.send_response(204); self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type"); self.end_headers()
    def do_POST(self):
        if self.path != "/ingest": self._headers(404); self.wfile.write(b'{"error":"not found"}'); return
        try:
            size = int(self.headers.get("Content-Length", "0")); raw = self.rfile.read(size)
            payload = normalize_json(json.loads(raw.decode("utf-8"))); path = save_payload(payload)
            self._headers(); self.wfile.write(json.dumps({"ok":True,"file":path.name}).encode())
        except Exception as exc:
            self._headers(400); self.wfile.write(json.dumps({"error":str(exc)}).encode())
    def do_GET(self):
        if self.path in {"/", "/health"}:
            self._headers(); self.wfile.write(b'{"ok":true,"service":"simgrid-bridge"}'); return
        if self.path == "/latest":
            path = INBOX / "latest.simgrid.json"
            if not path.exists(): self._headers(404); self.wfile.write(b'{"error":"no sessions"}'); return
            self._headers(200, "application/json; charset=utf-8")
            self.send_header if False else None
            self.wfile.write(path.read_bytes()); return
        self._headers(404); self.wfile.write(b'{"error":"not found"}')
    def log_message(self, fmt, *args): print("[bridge]", fmt % args)


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)
    conv = sub.add_parser("convert")
    conv.add_argument("input", type=Path); conv.add_argument("--game", default="other")
    conv.add_argument("--track", default="spa"); conv.add_argument("--car", default="roadcar")
    conv.add_argument("--output", type=Path)
    serve = sub.add_parser("serve"); serve.add_argument("--host", default="127.0.0.1"); serve.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    if args.cmd == "convert":
        if args.input.suffix.lower() == ".csv": payload = convert_csv(args.input,args.game,args.track,args.car)
        else: payload = normalize_json(json.loads(args.input.read_text(encoding="utf-8-sig")))
        out = args.output or args.input.with_suffix(".simgrid.json")
        out.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
        print(out)
    else:
        print(f"SimGrid Bridge: http://{args.host}:{args.port}")
        ThreadingHTTPServer((args.host,args.port),Handler).serve_forever()

if __name__ == "__main__": main()
