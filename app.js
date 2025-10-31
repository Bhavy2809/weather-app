// Advanced Weather App Features

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleButton(savedTheme);
}

function updateThemeToggleButton(theme) {
    const button = document.querySelector('.theme-toggle i');
    if (button) {
        button.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Favorites System
class FavoritesManager {
    constructor() {
        this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    }

    toggle(city) {
        const index = this.favorites.indexOf(city);
        if (index === -1) {
            this.favorites.push(city);
        } else {
            this.favorites.splice(index, 1);
        }
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.updateUI();
    }

    updateUI() {
        const container = document.getElementById('favorites-list');
        if (!container) return;
        
        container.innerHTML = this.favorites.map(city => `
            <button class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" 
                    onclick="getWeather('${city}')">
                ${city}
                <span class="favorite-btn" onclick="event.stopPropagation(); favoritesManager.toggle('${city}')">★</span>
            </button>
        `).join('');
    }

    isFavorite(city) {
        return this.favorites.includes(city);
    }
}

// Language Support
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'en';
        this.translations = {
            en: {
                search: 'Search',
                useLocation: 'Use My Location',
                favorites: 'Favorites',
                forecast: '7-Day Forecast',
                airQuality: 'Air Quality',
                alerts: 'Weather Alerts',
                loading: 'Loading...',
                error: 'Error loading data'
            },
            es: {
                search: 'Buscar',
                useLocation: 'Usar mi ubicación',
                favorites: 'Favoritos',
                forecast: 'Pronóstico de 7 días',
                airQuality: 'Calidad del aire',
                alerts: 'Alertas meteorológicas',
                loading: 'Cargando...',
                error: 'Error al cargar datos'
            }
        };
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        this.updateUI();
    }

    translate(key) {
        return this.translations[this.currentLang]?.[key] || key;
    }

    updateUI() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.translate(key);
        });
    }
}

// Weather Alerts System
class WeatherAlertsManager {
    constructor() {
        this.alertsContainer = document.getElementById('weather-alerts');
    }

    showAlert(alert) {
        if (!this.alertsContainer) return;

        const alertElement = document.createElement('div');
        alertElement.className = 'weather-alert alert alert-warning alert-dismissible fade show';
        alertElement.innerHTML = `
            <strong>${alert.event}</strong>: ${alert.desc}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        this.alertsContainer.appendChild(alertElement);
    }

    clearAlerts() {
        if (this.alertsContainer) {
            this.alertsContainer.innerHTML = '';
        }
    }
}

// Air Quality Display
class AirQualityManager {
    getAQIClass(aqi) {
        if (aqi <= 50) return 'aqi-good';
        if (aqi <= 100) return 'aqi-moderate';
        return 'aqi-poor';
    }

    updateDisplay(aqiData) {
        const container = document.getElementById('air-quality');
        if (!container || !aqiData) return;

        const aqiValue = aqiData.aqi || 0;
        container.innerHTML = `
            <div class="aqi-indicator ${this.getAQIClass(aqiValue)}">
                AQI: ${aqiValue}
            </div>
            <div class="mt-2">
                <small>
                    PM2.5: ${aqiData.pm2_5 || 'N/A'} μg/m³<br>
                    PM10: ${aqiData.pm10 || 'N/A'} μg/m³
                </small>
            </div>
        `;
    }
}

// Initialize managers
const favoritesManager = new FavoritesManager();
const languageManager = new LanguageManager();
const alertsManager = new WeatherAlertsManager();
const aqiManager = new AirQualityManager();

// Register service worker
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

// Export managers for use in main script
window.favoritesManager = favoritesManager;
window.languageManager = languageManager;
window.alertsManager = alertsManager;
window.aqiManager = aqiManager;