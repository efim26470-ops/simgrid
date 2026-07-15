# SimGrid Steam Connector

Worker keeps the Steam Web API key outside GitHub Pages.

## Deploy

1. Create a Steam Web API key.
2. Create a Cloudflare Worker and upload `worker.js`.
3. Add secret `STEAM_API_KEY`.
4. Add variable `ALLOWED_ORIGIN`, for example `https://your-name.github.io`.
5. Paste the Worker URL into SimGrid → Ещё → Steam Connector.

Endpoint used by the PWA:

`GET /steam/sync?steamid=7656119...`

The connector imports profile data, owned racing games, playtime and recently played games. Steam does not expose lap telemetry, tyre pressures or car setups.
