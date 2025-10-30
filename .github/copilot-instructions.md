## Quick orientation

- Purpose: a small single-page weather dashboard that fetches forecast data from WeatherAPI (via RapidAPI) and shows current weather, a 24-hour horizontal forecast, and a live radar map (Leaflet + RainViewer tiles).
- Key files:
  - `index.html` — page layout, adds the "Use My Location" button, hourly container (`#hourly`) and map container (`#radar-map`).
  - `script.js` — main app logic: API calls, DOM rendering, geolocation, Leaflet map init and radar overlay.
  - `videos/` — background videos used by `updateBackgroundVideo()` (e.g., `rain.mp4`, `sunny.mp4`, `clouds.mp4`, `fog.mp4`, `default.mp4`).

## Architecture / Data flow (short)

- UI triggers (search, dropdown city, "Use My Location") call the fetch layer -> `forecast.json?q=` endpoint on WeatherAPI via RapidAPI.
- The JSON shape used in the app:
  - `result.location.{name,lat,lon,country}`
  - `result.current.{temp_c,condition.icon,condition.text,cloud,humidity,feelslike_c,wind_kph,wind_degree}`
  - `result.forecast.forecastday[0].day.{maxtemp_c,mintemp_c}` and `result.forecast.forecastday[0].hour` (array of 24 hourly objects).
- After fetch: `renderMainCards()` updates current weather cards, `renderHourlyForecast()` populates the horizontal list, and `updateMap()` recenters the Leaflet map and places a marker. Background video switches via `updateBackgroundVideo()` based on condition text.

## Project-specific conventions & important gotchas

- API key: RapidAPI key is stored in `script.js` as `API_KEY`. To test locally, replace it with a valid RapidAPI key for `weatherapi-com.p.rapidapi.com`.
- Query format: the app uses `q=` with either city names (e.g., "Kanpur") or coordinates in `lat,lon` form. `getWeatherByCoords(lat,lon)` simply calls the same endpoint with `"lat,lon"`.
- Geolocation: the "Use My Location" button uses `navigator.geolocation`. Browsers require HTTPS or `localhost` for this to work — testing via `file://` may block location requests.
- Map & radar tiles:
  - Leaflet is included via CDN in `index.html`. Map is initialized in `initMap()`.
  - Radar overlay uses RainViewer public tiles (tile URL used in the code). RainViewer tiles are free but may have rate-limits — if tiles fail to load, the map still shows the OpenStreetMap base layer.
- Background videos are used as ambient visuals; swapping them requires placing similarly named files in `videos/`.

## How to run / debug locally

1. Serve the folder over a local HTTP server (recommended) so geolocation and fetch requests behave correctly. Example commands (PowerShell):

```powershell
# Python 3 in the project folder
python -m http.server 5500
# or using live-server if installed
npx live-server . --port=5500
```

2. Open `http://localhost:5500` in a browser. Allow location permission when prompted.
3. Devtools: watch network requests to `weatherapi-com.p.rapidapi.com/forecast.json` to inspect result shapes.

## Small, actionable edits an AI helper might perform

- Replace the hard-coded `API_KEY` with a config loader (e.g., read from `config.json`) and ignore it in git. The code currently expects the key inline.
- Swap RainViewer tiles if you need a different overlay source. See `radarLayer` creation in `script.js` for where to change the tile URL.
- If adding unit tests: test DOM rendering helpers (`renderHourlyForecast`, `renderMainCards`) by injecting a sample `forecast.json` fixture and asserting DOM updates.

## Where to be careful

- Do not remove the Leaflet `<script>` tag before `script.js`; the app expects `L` to be globally available. The project is plain HTML+JS — no bundler.
- Geolocation flows should handle denied permissions gracefully (the UI currently alerts and falls back to manual search).
- WeatherAPI responses can vary by subscription level. The consumer code assumes `forecast.forecastday[0]` exists. If you add multi-day support, guard for missing indexes.

---

If anything here is unclear or you'd like the instructions to emphasize a different workflow (for example, how to rotate API keys securely, or to include CI checks), tell me which area to expand and I'll update this file.
