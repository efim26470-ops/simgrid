# SimGrid PWA v2.2.1

Local-first iOS/desktop manager for sim-racing sessions, setups, strategy and track training. The project is fully static and deploys directly to GitHub Pages without a build step.

## Track Academy Pro

- 14 expanded track guides with key zones, braking references, entry-speed orientation, apex type, throttle phase and curb usage
- qualifying, race, wet and defensive training modes
- visual telemetry references for brake, throttle and steering input
- persistent training checklists and progress per track
- five-question mini tests with saved results
- local aerial imagery for Spa, Monza, Silverstone and Suzuka; unique offline Track Academy blueprint covers for every guide

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
2. Open **Settings → Pages**.
3. Select **Deploy from a branch**, branch `main`, folder `/root`.
4. Open the published URL once in Safari.
5. On iPhone use **Share → Add to Home Screen**.

The v2 service worker uses cache `simgrid-v2.2.1`. When replacing an older version, open the site once in Safari before reopening the Home Screen app so the new worker can activate.

## Steam and telemetry

A GitHub Pages project must not expose a Steam Web API key. Deploy the optional worker from `steam-worker/` and enter its address inside SimGrid. Steam can provide profile and library information, but it does not store lap telemetry or setup parameters. Session telemetry is imported through `telemetry-bridge/` or compatible JSON/CSV files.

## Privacy

Sessions, setup versions, favorites, guide progress and quiz results are stored locally in browser storage. Export a JSON backup before clearing Safari website data or moving to another device.

## v2.2.0 — macOS/iOS visual fix

- Пересобран каталог трасс и машин: новые карточки, фильтр по типу трассы / классу машины, улучшенные схемы, стартовые точки и рейтинг сложности.
- Исправлена визуальная проблема с одинаковой красной точкой на трассах: старт теперь вычисляется из SVG-пути.
- Обновлены модальные окна для macOS и iOS: аккуратные отступы, стабильная прокрутка, safe-area и нижние действия.
- Добавлены более заметные анимации появления карточек, отрисовки трека, открытия модального окна и hover/active-состояния.
- Расширены детали каталога: тренировочный план для трассы и инженерная подсказка для автомобиля.

## v2.2.1 — guide modal fix

- Обложки карточек больше не обрезаются и не дублируют текст внутри модального гайда.
- Уточнены динамическая высота, safe-area, заголовок и горизонтальное переполнение модальных окон на macOS/iOS.
- Обновлена версия PWA-кэша, чтобы установленное приложение получило визуальные исправления.
