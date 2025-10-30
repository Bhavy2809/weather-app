// ⚠️ IMPORTANT: API key handling
// For security, the app now requires a local `config.json` with an `API_KEY` field.
// This file is ignored by git. A sample is provided at `config.sample.json`.
let API_KEY = '6b43f7fc5bmsh2db7055f25efe9ep17ee7ejsn7d2dac741d4c';

const baseUrl = 'https://weatherapi-com.p.rapidapi.com/forecast.json?q=';
function makeFetchOptions() {
    return {
        method: 'GET',
        headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': 'weatherapi-com.p.rapidapi.com'
        }
    };
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
    document.getElementById('cityName').textContent = displayName || `${result.location.name}, ${result.location.country}`;
    document.querySelector('#temp').textContent = result.current.temp_c;
    document.querySelector('#weather-icon').src = result.current.condition.icon;
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
            <img src="${h.condition.icon}" alt="icon" style="height:36px;">
            <div class="hour-temp">${h.temp_c}°C</div>
        `;
        hourContainer.appendChild(card);
    });
}

// --- Map / Radar using Leaflet ---------------------------------
let map, radarLayer, locationMarker;
function initMap() {
    try {
        map = L.map('radar-map', { center: [22.5, 80], zoom: 5 });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // RainViewer radar tiles (public). We use the 'latest' composite layer when available.
        const radarUrl = 'https://tilecache.rainviewer.com/v2/radar/nowcast/{z}/{x}/{y}.png';
        radarLayer = L.tileLayer(radarUrl, { opacity: 0.6, attribution: 'rainviewer.com' });
        radarLayer.addTo(map);
    } catch (err) {
        console.warn('Leaflet init failed', err);
    }
}

function updateMap(lat, lon) {
    if (!map) return;
    map.setView([lat, lon], 8);
    if (locationMarker) {
        locationMarker.setLatLng([lat, lon]);
    } else {
        locationMarker = L.marker([lat, lon]).addTo(map);
    }
}

// --- Fetch + orchestrate --------------------------------------
async function fetchWeather(query) {
    const url = baseUrl + encodeURIComponent(query);
    console.log('Fetching weather for URL:', url);
    try {
        const result = await fetchJson(url);
        console.log('Weather API response:', result);
        return result;
    } catch (err) {
        console.error('Weather API error:', err);
        throw err;
    }
}

async function getWeather(city) {
    document.getElementById('cityName').textContent = 'Loading...';
    try {
        const result = await fetchWeather(city);
        renderMainCards(result, city);
        renderHourlyForecast(result);
        if (result.location && result.location.lat && result.location.lon) {
            updateMap(result.location.lat, result.location.lon);
        }
    } catch (err) {
        console.error(err);
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
        renderMainCards(result, `${result.location.name} (Your location)`);
        renderHourlyForecast(result);
        updateMap(lat, lon);
    } catch (err) {
        console.error('Error fetching weather:', err);
        alert('Unable to fetch weather for your location. ' + err.message);
        document.getElementById('cityName').textContent = 'Location Error';
    }
}

// --- Table for other cities (unchanged behaviour) ---------------
const fetchWeatherForOtherCities = async () => {
    const cities = ['Lucknow', 'Hyderabad', 'Pune', 'Jaipur'];
    const tableBody = document.querySelector('.table tbody');
    tableBody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    let tableHTML = '';
    for (const city of cities) {
        try {
            const result = await fetchWeather(city);
            tableHTML += `
                <tr>
                    <th scope="row" class="text-start">${city}</th>
                    <td>${result.current.temp_c}</td>
                    <td>${result.current.feelslike_c}</td>
                    <td>${result.current.humidity}</td>
                    <td>${result.current.wind_kph}</td>
                    <td>${result.current.condition.text}</td>
                </tr>`;
        } catch (error) {
            console.error(`Could not fetch weather for ${city}`);
        }
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
    await loadConfig();
    await ensureBackgroundVideo();
    initMap();

    if (!(await ensureApiKeyOrDemo())) {
        return;
    }

    // default city
    getWeather('Kanpur');
    fetchWeatherForOtherCities();
});
