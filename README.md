# weather-app
A Live Weather Broadcasting Web-Application

This is a small single-page weather dashboard that demonstrates live forecasts, a 24-hour horizontal forecast, and an interactive radar map. The project is intentionally light-weight (static HTML + JS) so it can be served from any static host.

## 5G eMBB justification

This project includes a high-resolution, continuously updating radar overlay (tile streaming) and multiple visual assets (background videos). Streaming these high-bandwidth tiles and media frames with low latency provides a noticeably smoother experience on 5G (eMBB) compared to typical 4G connections. Use cases where 5G adds value:

- Seamless high-resolution radar tiles with minimal buffering while panning/zooming the map.
- Fast, low-latency updates for live weather layers when many users request frequent updates (useful for crowded public events or emergency services).
- Delivery of HD background videos concurrently with real-time map tiles without degrading responsiveness.

In short: the radar + video streaming combo is a simple demo that showcases why eMBB enables richer, more interactive weather dashboards.

## Run locally

1. Copy `config.sample.json` to `config.json` and set your RapidAPI key for WeatherAPI (optional). If you don't provide `config.json`, the app will use the default key embedded in the code (for local testing):

```json
{
	"API_KEY": "YOUR_RAPIDAPI_KEY_HERE"
}
```

2. Serve the folder (PowerShell example):

```powershell
python -m http.server 5500
# or
npx live-server . --port=5500
```

3. Open `http://localhost:5500` in a browser and allow location permission to use the "Use My Location" button.

NOTE: The app will not attempt to fetch weather data unless `config.json` exists with a valid `API_KEY` (see step 1). If `config.json` is missing the UI will still load (map will render) but weather requests are disabled to avoid leaking or using a default key.

## Notes

- The app fetches forecasts from WeatherAPI via RapidAPI. Check the network tab for `forecast.json?q=` requests when debugging.
- Radar tiles are sourced from RainViewer (public tiles) — they may be rate-limited. If tiles don't show, the base OpenStreetMap layer still displays.
