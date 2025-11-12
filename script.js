// ⚠️ IMPORTANT: API key handling
// For security, the app now requires a local `config.json` with an `API_KEY` field.
// This file is ignored by git. A sample is provided at `config.sample.json`.
console.log('📦 script.js loaded - Weather App v2.0');
// NOTE: The config.json file will override this fallback key
let API_KEY = '71c8f7cb35msh3d625ea9cc2f194p177104jsne3e4cf1850c2'; // Fallback - will be replaced by config.json
let currentLanguage = localStorage.getItem('language') || 'en';
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

const baseUrl = 'https://weatherapi-com.p.rapidapi.com/forecast.json?q=';
const alertsUrl = 'https://weatherapi-com.p.rapidapi.com/alerts.json?q=';
const airQualityUrl = 'https://weatherapi-com.p.rapidapi.com/air-quality.json?q=';
const historyUrl = 'https://weatherapi-com.p.rapidapi.com/history.json?q=';

function makeFetchOptions() {
    return {
        method: 'GET',
        headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': 'weatherapi-com.p.rapidapi.com'
        }
    };
}

// Initialize service worker for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Theme management
function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeButton(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeButton(next);
}

// Favorites management
function toggleFavorite(city) {
    const index = favorites.indexOf(city);
    if (index === -1) {
        favorites.push(city);
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesList();
}

function updateFavoritesList() {
    const container = document.getElementById('favorites-list');
    if (!container) return;
    
    container.innerHTML = favorites.map(city => `
        <div class="favorite-item" onclick="getWeather('${city}')">
            ${city}
            <span class="favorite-btn" onclick="toggleFavorite('${city}')">★</span>
        </div>
    `).join('');
}

// --- Helpers -------------------------------------------------
async function fetchJson(url) {
    const res = await fetch(url, makeFetchOptions());
    if (!res.ok) {
        // Try to extract a useful error message from the response body
        let bodyText = '';
        try {
            bodyText = await res.text();
            const parsed = JSON.parse(bodyText);
            const message = parsed && (parsed.error?.message || parsed.message || parsed.error);
            throw new Error(message || `Fetch failed: ${res.status} ${res.statusText}`);
        } catch (parseErr) {
            // If parsing failed, include raw body text for debugging
            throw new Error(bodyText ? `Fetch failed: ${res.status} ${res.statusText} - ${bodyText}` : `Fetch failed: ${res.status} ${res.statusText}`);
        }
    }
    return res.json();
}

// Try to load optional `config.json` (untracked) so API keys can be kept out of source.
async function loadConfig() {
    try {
        const res = await fetch('config.json');
        if (!res.ok) return; // no config provided
        const cfg = await res.json();
        if (cfg && cfg.API_KEY) {
            API_KEY = cfg.API_KEY;
            console.info('Loaded API_KEY from config.json');
        }
    } catch (err) {
        // ignore - we fallback to DEFAULT_API_KEY
    }
}

// Verify API key is properly configured
async function ensureApiKeyOrDemo() {
    // Check API key
    if (!API_KEY || API_KEY === 'YOUR_RAPIDAPI_KEY_HERE') {
        console.warn('API_KEY missing or placeholder');
        showConfigBanner();
        return false;
    }
    
    // Check geolocation support
    if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser');
    } else {
        console.log('Geolocation is supported');
    }

    // Log permissions state if available
    if (navigator.permissions) {
        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            console.log('Geolocation permission state:', result.state);
            result.addEventListener('change', () => {
                console.log('Geolocation permission state changed to:', result.state);
            });
        } catch (err) {
            console.warn('Could not query geolocation permission:', err);
        }
    }

    return true;
}

function updateBackgroundVideo(condition) {
    const videoElement = document.getElementById('background-video');
    if (!videoElement) {
        console.log('Background video element not found, creating it');
        // Create video element if it doesn't exist
        const newVideo = document.createElement('video');
        newVideo.id = 'background-video';
        newVideo.autoplay = true;
        newVideo.muted = true;
        newVideo.loop = true;
        newVideo.style.cssText = 'position:fixed;right:0;bottom:0;min-width:100%;min-height:100%;z-index:-1;object-fit:cover;';
        const source = document.createElement('source');
        newVideo.appendChild(source);
        document.body.insertBefore(newVideo, document.body.firstChild);
        return updateBackgroundVideo(condition);
    }

    const sourceElement = videoElement.querySelector('source');
    if (!sourceElement) {
        console.log('Source element not found, creating it');
        const source = document.createElement('source');
        videoElement.appendChild(source);
        return updateBackgroundVideo(condition);
    }

    const conditionText = (condition || '').toLowerCase();
    try {
        if (conditionText.includes('rain') || conditionText.includes('drizzle')) {
            sourceElement.src = 'videos/rain.mp4';
        } else if (conditionText.includes('sun') || conditionText.includes('clear')) {
            sourceElement.src = 'videos/sunny.mp4';
        } else if (conditionText.includes('cloud') || conditionText.includes('overcast')) {
            sourceElement.src = 'videos/clouds.mp4';
        } else if (conditionText.includes('mist') || conditionText.includes('fog')) {
            sourceElement.src = 'videos/fog.mp4';
        } else {
            sourceElement.src = 'videos/default.mp4';
        }
        videoElement.load();
    } catch (err) {
        console.warn('Error updating background video:', err);
    }
}

// --- Rendering -------------------------------------------------
function renderMainCards(result, displayName) {
    console.log('🎨 Rendering main cards for:', displayName);
    document.getElementById('cityName').textContent = displayName || `${result.location.name}, ${result.location.country}`;
    document.querySelector('#temp').textContent = result.current.temp_c;
    document.querySelector('#weather-icon').src = result.current.condition.icon;
    document.querySelector('#weather-icon').alt = result.current.condition.text;
    document.querySelector('#cloud_pct').textContent = result.current.cloud;
    document.querySelector('#humid').textContent = result.current.humidity;
    document.querySelector('#maxt').textContent = result.forecast.forecastday[0].day.maxtemp_c;
    document.querySelector('#mint').textContent = result.forecast.forecastday[0].day.mintemp_c;
    document.querySelector('#sunrise').textContent = result.forecast.forecastday[0].astro.sunrise;
    document.querySelector('#sunset').textContent = result.forecast.forecastday[0].astro.sunset;
    document.querySelector('#feels').textContent = result.current.feelslike_c;
    document.querySelector('#wind-speed').textContent = result.current.wind_kph;
    document.querySelector('#wind-degree').textContent = result.current.wind_degree;
    updateBackgroundVideo(result.current.condition.text);
    
    // Update 3D Earth with current weather if function exists
    if (typeof update3DEarthWeather === 'function') {
        console.log('🌍 Updating 3D Earth weather...');
        update3DEarthWeather(result);
    } else {
        console.warn('⚠️ update3DEarthWeather function not available');
    }
}

function renderHourlyForecast(result) {
    const hourContainer = document.getElementById('hourly');
    hourContainer.innerHTML = '';
    const hours = result.forecast.forecastday[0].hour || [];
    hours.forEach(h => {
        const time = new Date(h.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        const card = document.createElement('div');
        card.className = 'hour-card';
        card.innerHTML = `
            <div class="hour-time">${time}</div>
            <img src="${h.condition.icon}" alt="${h.condition.text}" style="height:36px;width:36px;" onerror="this.style.display='none'">
            <div class="hour-temp">${h.temp_c}°C</div>
        `;
        hourContainer.appendChild(card);
    });
}

// --- Map / Radar using Leaflet ---------------------------------
let map, radarLayer, locationMarker, cloudLayer, precipLayer, tempLayer, pressureLayer;
let weatherLayers = [];

async function getLatestRadarTimestamp() {
    try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await response.json();
        if (data.radar && data.radar.past && data.radar.past.length > 0) {
            // Get the most recent radar timestamp
            return data.radar.past[data.radar.past.length - 1].path;
        }
    } catch (err) {
        console.warn('Could not fetch RainViewer timestamp:', err);
    }
    return null;
}

function initMap() {
    try {
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.error('Leaflet library not loaded yet, retrying in 500ms...');
            setTimeout(initMap, 500);
            return;
        }

        // Check if map container exists
        const mapContainer = document.getElementById('radar-map');
        if (!mapContainer) {
            console.error('Map container #radar-map not found');
            return;
        }

        // Prevent re-initialization
        if (map) {
            console.log('Map already initialized');
            return;
        }

        console.log('Initializing Leaflet map with full-coverage weather visualization...');

        // Initialize map with darker base for better contrast
        map = L.map('radar-map').setView([20.5937, 78.9629], 5); // Wider view of India
        
        // Use a clean base map without weather overlay
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        const OPENWEATHER_API_KEY = '439d4b804bc8187953eb36d2a8c26a02';
        
        // Don't add temperature layer - it causes green background everywhere
        // Temperature data is available in the clicked location details instead
        
        // LAYER 1: Clouds - Only shows where there are actual clouds
        cloudLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`, {
            attribution: 'OpenWeatherMap - Clouds',
            opacity: 0.5, // Visible clouds
            maxZoom: 19
        });
        cloudLayer.addTo(map);
        weatherLayers.push({ name: 'Clouds', layer: cloudLayer });
        console.log('✓ Clouds layer added - shows cloud coverage spots');

        // LAYER 2: Precipitation - Shows ONLY where it's actively raining/snowing
        precipLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`, {
            attribution: 'OpenWeatherMap - Precipitation',
            opacity: 0.8, // High visibility for active rain
            maxZoom: 19
        });
        precipLayer.addTo(map);
        weatherLayers.push({ name: 'Precipitation', layer: precipLayer });
        console.log('✓ Precipitation layer added - shows active rain/snow areas');

        // Wind layer available but not shown by default (causes visual clutter)
        
        // LAYER 3: Radar - Live precipitation radar (when available)
        // Shows real-time precipitation with high detail
        getLatestRadarTimestamp().then(radarPath => {
            if (radarPath) {
                console.log('✓ Loading live radar with timestamp:', radarPath);
                const radarUrl = `https://tilecache.rainviewer.com${radarPath}/256/{z}/{x}/{y}/6/1_1.png`;
                radarLayer = L.tileLayer(radarUrl, { 
                    opacity: 0.7, // Balanced opacity
                    attribution: 'RainViewer - Live Radar',
                    maxZoom: 19
                });
                radarLayer.addTo(map);
                weatherLayers.push({ name: 'Radar', layer: radarLayer });
                console.log('✓ Live radar layer active');
            } else {
                console.log('⚠ No live radar data available at this time');
            }
        });

        console.log('✓ Map initialized with 5 weather layers:');
        console.log('  1. Temperature (Purple->Blue->Green->Yellow->Red): Base layer, always visible');
        console.log('  2. Clouds (White): Cloud coverage overlay');
        console.log('  3. Precipitation (Green->Yellow->Red): Active rain/snow areas');
        console.log('  4. Wind (Blue): Wind speed and direction');
        console.log('  5. Radar (Cyan/Magenta): Live precipitation radar');
        
        // Add click event to get weather at clicked location
        map.on('click', async function(e) {
            const lat = e.latlng.lat.toFixed(4);
            const lon = e.latlng.lng.toFixed(4);
            console.log(`Map clicked at: ${lat}, ${lon}`);
            
            // Show loading indicator at clicked location
            const clickMarker = L.marker([lat, lon], {
                icon: L.divIcon({
                    className: 'click-loading-marker',
                    html: '<div style="background: #007bff; color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px; white-space: nowrap;">Loading...</div>',
                    iconSize: [80, 30]
                })
            }).addTo(map);
            
            try {
                // Fetch weather for clicked coordinates
                await getWeatherByCoords(lat, lon);
                
                // Remove loading marker after successful fetch
                setTimeout(() => {
                    map.removeLayer(clickMarker);
                }, 2000);
                
                // Scroll to top to show weather details
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
                console.error('Error fetching weather for clicked location:', err);
                map.removeLayer(clickMarker);
                alert(`Could not fetch weather for this location: ${err.message}`);
            }
        });
        
        console.log('✓ Map click handler added - click anywhere to get weather!');
        
        // Force a redraw
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                console.log('✓ All weather layers should now be visible across the entire map');
            }
        }, 100);

    } catch (err) {
        console.error('Leaflet init failed:', err);
    }
}

function updateMap(lat, lon) {
    if (!map) {
        console.log('Map not initialized, attempting to initialize...');
        initMap();
        // Wait a bit for map to initialize
        setTimeout(() => updateMap(lat, lon), 500);
        return;
    }
    try {
        map.setView([lat, lon], 10);
        if (locationMarker) {
            locationMarker.setLatLng([lat, lon]);
        } else {
            locationMarker = L.marker([lat, lon]).addTo(map);
        }
        console.log(`Map updated to: ${lat}, ${lon}`);
    } catch (err) {
        console.error('Error updating map:', err);
    }
}

// --- Fetch + orchestrate --------------------------------------
async function fetchWeather(query) {
    const url = baseUrl + encodeURIComponent(query);
    console.log('Fetching weather for URL:', url);
    
    // Start performance monitoring if available
    if (typeof startPerformanceMonitoring === 'function') {
        startPerformanceMonitoring();
    }
    
    try {
        const result = await fetchJson(url);
        console.log('Weather API response:', result);
        
        // End performance monitoring if available
        if (typeof endPerformanceMonitoring === 'function') {
            endPerformanceMonitoring();
        }
        
        return result;
    } catch (err) {
        console.error('Weather API error:', err);
        
        // End performance monitoring even on error
        if (typeof endPerformanceMonitoring === 'function') {
            endPerformanceMonitoring();
        }
        
        throw err;
    }
}

async function getWeather(city) {
    console.log('🔍 getWeather called with city:', city);
    document.getElementById('cityName').textContent = 'Loading...';
    try {
        console.log('📡 Fetching weather data...');
        const result = await fetchWeather(city);
        console.log('✅ Weather data received:', result);
        renderMainCards(result, city);
        renderHourlyForecast(result);
        if (result.location && result.location.lat && result.location.lon) {
            updateMap(result.location.lat, result.location.lon);
        }
    } catch (err) {
        console.error('❌ Error in getWeather:', err);
        alert('City not found. Please try again.');
        document.getElementById('cityName').textContent = 'Not Found';
    }
}

async function getWeatherByCoords(lat, lon) {
    document.getElementById('cityName').textContent = 'Detecting location...';
    try {
        console.log(`Fetching weather for coordinates: ${lat},${lon}`);
        const result = await fetchWeather(`${lat},${lon}`);
        console.log('Weather data received:', result);
        
        // Determine display name
        let displayName = result.location.name;
        if (result.location.region && result.location.region !== result.location.name) {
            displayName += `, ${result.location.region}`;
        }
        displayName += ` (${parseFloat(lat).toFixed(2)}, ${parseFloat(lon).toFixed(2)})`;
        
        renderMainCards(result, displayName);
        renderHourlyForecast(result);
        updateMap(result.location.lat, result.location.lon);
    } catch (err) {
        console.error('Error fetching weather:', err);
        alert('Unable to fetch weather for this location. ' + err.message);
        document.getElementById('cityName').textContent = 'Location Error';
    }
}

// --- Table for other cities with dynamic city management ---------------
let comparisonCities = JSON.parse(localStorage.getItem('comparisonCities') || '["Lucknow", "Hyderabad", "Pune", "Jaipur"]');

function saveComparisonCities() {
    localStorage.setItem('comparisonCities', JSON.stringify(comparisonCities));
}

function addCityToComparison(cityName) {
    const city = cityName.trim();
    if (!city) {
        alert('Please enter a city name');
        return;
    }
    if (comparisonCities.includes(city)) {
        alert('City already in the list');
        return;
    }
    comparisonCities.push(city);
    saveComparisonCities();
    fetchWeatherForOtherCities();
}

function removeCityFromComparison(cityName) {
    comparisonCities = comparisonCities.filter(c => c !== cityName);
    saveComparisonCities();
    fetchWeatherForOtherCities();
}

function resetCitiesToDefault() {
    if (confirm('Reset to default cities (Lucknow, Hyderabad, Pune, Jaipur)?')) {
        comparisonCities = ['Lucknow', 'Hyderabad', 'Pune', 'Jaipur'];
        saveComparisonCities();
        fetchWeatherForOtherCities();
    }
}

const fetchWeatherForOtherCities = async () => {
    const tableBody = document.querySelector('.table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading weather data...</td></tr>';
    let tableHTML = '';
    
    for (const city of comparisonCities) {
        try {
            const result = await fetchWeather(city);
            tableHTML += `
                <tr>
                    <th scope="row" class="text-start">${city}</th>
                    <td>${result.current.temp_c}°C</td>
                    <td>${result.current.feelslike_c}°C</td>
                    <td>${result.current.humidity}%</td>
                    <td>${result.current.wind_kph} km/h</td>
                    <td><img src="${result.current.condition.icon}" width="30" alt="${result.current.condition.text}"> ${result.current.condition.text}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="removeCityFromComparison('${city}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        } catch (error) {
            console.error(`Could not fetch weather for ${city}:`, error);
            // Show error with retry option
            tableHTML += `
                <tr>
                    <th scope="row" class="text-start">${city}</th>
                    <td colspan="5" class="text-warning">
                        <i class="fas fa-exclamation-triangle"></i> Failed to load
                        <button class="btn btn-sm btn-outline-primary ms-2" onclick="fetchWeatherForOtherCities()">
                            <i class="fas fa-sync"></i> Retry
                        </button>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="removeCityFromComparison('${city}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        }
    }
    
    if (tableHTML === '') {
        tableHTML = '<tr><td colspan="7" class="text-center text-muted">No cities added. Use the input above to add cities.</td></tr>';
    }
    
    tableBody.innerHTML = tableHTML;
};

// --- Event wiring -----------------------------------------------
document.getElementById('submit').addEventListener('click', (e) => {
    e.preventDefault();
    const cityInput = document.getElementById('city').value.trim();
    if (cityInput) getWeather(cityInput);
});

document.querySelectorAll('.dropdown-item').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const city = e.target.innerText.trim();
        getWeather(city);
    });
});

document.getElementById('use-location').addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    document.getElementById('cityName').textContent = 'Requesting location permission...';
    navigator.geolocation.getCurrentPosition((pos) => {
        console.log('Got coordinates:', pos.coords);
        const {latitude, longitude} = pos.coords;
        getWeatherByCoords(latitude, longitude);
    }, (err) => {
        console.error('Geolocation error:', err);
        let errorMessage = 'Unable to retrieve your location. ';
        switch(err.code) {
            case 1: errorMessage += 'Please allow location access.'; break;
            case 2: errorMessage += 'Position unavailable.'; break;
            case 3: errorMessage += 'Request timed out.'; break;
        }
        alert(errorMessage);
        document.getElementById('cityName').textContent = 'Location Access Denied';
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
});

// City management event listeners
document.getElementById('add-city-btn').addEventListener('click', () => {
    const cityInput = document.getElementById('new-city-input');
    addCityToComparison(cityInput.value);
    cityInput.value = '';
});

document.getElementById('new-city-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const cityInput = document.getElementById('new-city-input');
        addCityToComparison(cityInput.value);
        cityInput.value = '';
    }
});

document.getElementById('reset-cities-btn').addEventListener('click', resetCitiesToDefault);

// --- Boot -------------------------------------------------------
// Hide video if source is missing and fall back to CSS background.
async function ensureBackgroundVideo() {
    const videoElement = document.getElementById('background-video');
    if (!videoElement) return;
    const sourceElement = videoElement.querySelector('source');
    if (!sourceElement) return;

    // Candidate src is stored in data-src to avoid auto-loading by the browser.
    const candidate = sourceElement.dataset.src || sourceElement.getAttribute('src');
    if (!candidate) {
        videoElement.style.display = 'none';
        document.body.style.background = 'linear-gradient(180deg,#e6f0ff,#ffffff)';
        return;
    }

    try {
        const head = await fetch(candidate, { method: 'HEAD' });
        if (head.ok) {
            // enable the video now that we know the file exists
            sourceElement.src = candidate;
            videoElement.style.display = '';
            try { videoElement.load(); } catch (e) { /* ignore */ }
        } else {
            videoElement.style.display = 'none';
            document.body.style.background = 'linear-gradient(180deg,#e6f0ff,#ffffff)';
        }
    } catch (err) {
        videoElement.style.display = 'none';
        document.body.style.background = 'linear-gradient(180deg,#e6f0ff,#ffffff)';
    }
}

function showConfigBanner() {
    const existing = document.getElementById('config-banner');
    if (existing) return;
    const banner = document.createElement('div');
    banner.id = 'config-banner';
    banner.style.cssText = 'position:fixed;left:12px;right:12px;top:12px;padding:12px;background:#fff3cd;color:#856404;border:1px solid #ffeeba;border-radius:6px;z-index:9999;font-family:Arial,sans-serif;';
    banner.innerHTML = '<strong>API key missing:</strong> create `config.json` from `config.sample.json` and add your RapidAPI API_KEY to enable weather requests.';
    document.body.appendChild(banner);
}



window.addEventListener('load', async () => {
    console.log('🚀 Application starting...');
    await loadConfig();
    console.log('✅ Config loaded, API_KEY:', API_KEY ? 'Present' : 'Missing');
    await ensureBackgroundVideo();
    
    // Initialize map - give DOM time to be ready
    setTimeout(() => {
        console.log('🗺️ Initializing map...');
        initMap();
    }, 1000);

    if (!(await ensureApiKeyOrDemo())) {
        console.error('❌ API key validation failed');
        return;
    }

    // default city
    console.log('🌍 Loading default city: Kanpur');
    getWeather('Kanpur');
    fetchWeatherForOtherCities();
});
