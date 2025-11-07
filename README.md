# weather-app
A Live Weather Broadcasting Web-Application with Advanced Features

This is a comprehensive single-page weather dashboard featuring live forecasts, 24-hour predictions, an interactive multi-layer radar map, and modern PWA capabilities. Built with vanilla HTML, CSS, and JavaScript for maximum portability.

## 🌟 **Key Features**

### **Weather Data & Forecasting**
- ✅ **Current Weather Conditions**: Temperature, humidity, cloud cover, "feels like" temp
- ✅ **Daily Min/Max Temperatures**: High and low predictions
- ✅ **24-Hour Forecast**: Horizontal scrollable hourly predictions with weather icons
- ✅ **Sunrise/Sunset Times**: Astronomical data for any location
- ✅ **Wind Information**: Speed (km/h) and direction (degrees)
- ✅ **Multiple City Comparison**: Side-by-side weather table for different cities

### **Interactive Map Features**
- ✅ **5-Layer Weather Visualization Map**:
  1. **Temperature Layer** (100% opacity): Full-map coverage with color gradient (Purple→Blue→Green→Yellow→Red)
  2. **Cloud Coverage Layer** (60% opacity): White overlay showing cloud density
  3. **Precipitation Layer** (80% opacity): Rain/snow intensity (Green→Yellow→Red)
  4. **Wind Pattern Layer** (50% opacity): Wind speed and direction visualization
  5. **Live Radar Layer** (70% opacity): Real-time precipitation radar from RainViewer
- ✅ **Click-to-Get-Weather**: Click anywhere on the map to fetch weather for that location
- ✅ **Interactive Controls**: Zoom, pan, and explore weather patterns globally
- ✅ **Dark Base Map**: High-contrast CartoDB dark theme for maximum color visibility
- ✅ **Detailed Color Legend**: Comprehensive specifications for all weather visualizations

### **User Experience**
- ✅ **Geolocation Support**: "Use My Location" button for instant local weather
- ✅ **City Search**: Search any city worldwide by name
- ✅ **City Dropdown**: Quick access to popular cities
- ✅ **Dynamic Backgrounds**: Weather-condition-based video backgrounds (rain, sunny, clouds, fog)
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile devices

### **Advanced Features**
- ✅ **Dark/Light Theme Toggle**: User-selectable themes with CSS variables
- ✅ **Favorites System**: Save and quickly access favorite cities
- ✅ **Custom City Management**: Add/remove cities to the comparison table
- ✅ **Persistent Storage**: Settings and favorites saved in localStorage
- ✅ **PWA Support**: Installable as a Progressive Web App
- ✅ **Service Worker**: Offline capability with caching
- ✅ **Multi-language Framework**: Translation support ready
- ✅ **Weather Icons**: Visual representations for all weather conditions

### **Technical Highlights**
- ✅ **Multiple Data Sources**: WeatherAPI, OpenWeatherMap, RainViewer
- ✅ **Real-time Streaming**: Live radar data with latest timestamps
- ✅ **Error Handling**: Graceful fallbacks and user-friendly error messages
- ✅ **Performance Optimized**: Efficient tile loading and caching
- ✅ **Modern JavaScript**: Async/await, ES6+ features
- ✅ **No Framework Dependencies**: Vanilla JS for maximum performance

## 5G eMBB justification

This project demonstrates **5G Enhanced Mobile Broadband (eMBB)** capabilities through:

- **Five simultaneous high-resolution weather data layers** streaming without buffering
- **Real-time radar tiles** with sub-second updates and seamless panning/zooming
- **HD background videos** playing concurrently with map tiles without degradation
- **Instant weather data fetching** on map clicks demonstrating low latency
- **High-bandwidth tile streaming** (temperature, clouds, precipitation, wind, radar)
- **No lag or buffering** when exploring multiple visualizations simultaneously

**5G Use Cases Demonstrated:**
- Seamless high-resolution radar tiles with minimal buffering while panning/zooming the map
- Fast, low-latency updates for live weather layers when many users request frequent updates
- Delivery of HD background videos concurrently with real-time map tiles without degrading responsiveness
- Instant interactive responses (click-to-weather) showcasing low latency
- Multiple data-heavy layers streaming simultaneously without performance issues

In short: The multi-layer radar map + video streaming + real-time data fetching combo demonstrates why 5G eMBB enables richer, more interactive weather dashboards.

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

## 🎨 **Weather Map Color Specifications**

### **Temperature Layer (Base - Always Visible)**
- **-20°C to 0°C**: Purple/Blue (cold regions, mountains)
- **0°C to 15°C**: Cyan/Green (moderate/cool)
- **15°C to 30°C**: Yellow/Orange (warm)
- **30°C+**: Red/Magenta (hot regions)

### **Cloud Coverage (White Overlay)**
- **0-25%**: Transparent (clear skies)
- **25-50%**: Light white (partly cloudy)
- **50-75%**: Medium white (mostly cloudy)
- **75-100%**: Solid white (overcast)

### **Precipitation Intensity**
- **0.1-2mm/h**: Light Green (light rain)
- **2-5mm/h**: Yellow-Green (moderate rain)
- **5-10mm/h**: Yellow (rain)
- **10-20mm/h**: Orange (heavy rain)
- **20mm/h+**: Red (very heavy rain/storm)

### **Wind Speed**
- **0-20 km/h**: Light Blue (light breeze)
- **20-50 km/h**: Blue (moderate wind)
- **50+ km/h**: Dark Blue (strong wind)

### **Live Radar**
- **Cyan/Magenta**: Real-time precipitation intensity

## 🚀 **How to Use**

1. **Search for a City**: Type any city name in the search bar
2. **Use Geolocation**: Click "Use My Location" to get weather for your current position
3. **Click on Map**: Click anywhere on the map to fetch weather for that location
4. **Manage Cities**: Add or remove cities from the comparison table
5. **Toggle Theme**: Switch between dark and light modes
6. **Add Favorites**: Save frequently-checked cities for quick access
7. **Explore Layers**: Zoom and pan the map to explore weather patterns

## 📱 **Progressive Web App**

Install the app on your device:
- **Desktop**: Click the install icon in your browser's address bar
- **Mobile**: Use "Add to Home Screen" from your browser menu
- **Offline**: The app works offline with cached data via Service Worker

## 🛠️ **Technology Stack**

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Styling**: Bootstrap 5.3.8, Font Awesome 6.0
- **Mapping**: Leaflet.js 1.9.4
- **APIs**: 
  - WeatherAPI.com (via RapidAPI) - Weather data
  - OpenWeatherMap - Temperature, clouds, precipitation, wind layers
  - RainViewer - Live radar data
- **PWA**: Service Worker, Web App Manifest
- **Storage**: LocalStorage for settings and favorites

## Notes

- The app fetches forecasts from WeatherAPI via RapidAPI. Check the network tab for `forecast.json?q=` requests when debugging.
- Radar tiles are sourced from RainViewer (public tiles) — they may be rate-limited. If tiles don't show, the base OpenStreetMap layer still displays.
- Weather visualization layers from OpenWeatherMap provide continuous coverage across the entire visible map area.
- Click anywhere on the map to instantly fetch weather for that location - demonstrates 5G low-latency capabilities.

## 📊 **Project Structure**

```
weather-app-1/
├── index.html          # Main UI layout
├── script.js           # Core application logic & map functionality
├── app.js             # Feature managers (theme, favorites, translations)
├── sw.js              # Service Worker for PWA
├── manifest.json      # PWA configuration
├── translations.js    # Multi-language support
├── config.json        # API key configuration (gitignored)
├── config.sample.json # Template for API configuration
├── videos/            # Background videos for weather conditions
└── .github/           # Copilot instructions
```

## 🌐 **Browser Support**

- Chrome/Edge: Full support ✅
- Firefox: Full support ✅
- Safari: Full support ✅
- Mobile browsers: Full support ✅

**Geolocation requires HTTPS or localhost**

---

**Built with ❤️ for demonstrating 5G eMBB capabilities in real-time weather visualization**
