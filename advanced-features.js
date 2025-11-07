// ===================================================================
// ADVANCED FEATURES - 5G Immersive Experience
// ===================================================================

// ===================================================================
// 1. 5G PERFORMANCE MONITORING
// ===================================================================
let performanceMetrics = {
    startTime: 0,
    endTime: 0,
    latency: 0
};

function startPerformanceMonitoring() {
    performanceMetrics.startTime = performance.now();
    const indicator = document.getElementById('performance-indicator');
    if (indicator) {
        indicator.classList.add('loading');
    }
}

function endPerformanceMonitoring() {
    performanceMetrics.endTime = performance.now();
    performanceMetrics.latency = Math.round(performanceMetrics.endTime - performanceMetrics.startTime);
    
    const latencyElement = document.getElementById('latency-value');
    const indicator = document.getElementById('performance-indicator');
    
    if (latencyElement) {
        latencyElement.textContent = performanceMetrics.latency;
        latencyElement.style.color = performanceMetrics.latency < 100 ? '#00ff00' : 
                                     performanceMetrics.latency < 300 ? '#ffaa00' : '#ff0000';
    }
    
    if (indicator) {
        indicator.classList.remove('loading');
    }
}

// Monitor network information
function updateNetworkInfo() {
    const networkInfo = document.getElementById('network-info');
    if (networkInfo && navigator.connection) {
        const connection = navigator.connection;
        const effectiveType = connection.effectiveType || 'unknown';
        networkInfo.textContent = `Network: ${effectiveType.toUpperCase()}`;
        
        if (effectiveType === '4g' || effectiveType === '5g') {
            networkInfo.style.color = '#00ff00';
        }
    }
}

setInterval(updateNetworkInfo, 5000);
updateNetworkInfo();

// ===================================================================
// 2. 3D EARTH VIEW WITH THREE.JS + LIVE WEATHER OVERLAY
// ===================================================================
let scene, camera, renderer, earth, controls;
let earthInitialized = false;
let weatherMarkers = []; // Store weather markers on globe
let currentWeatherData = null;

function init3DEarth() {
    if (earthInitialized) return;
    
    try {
        const container = document.getElementById('earth-canvas');
        if (!container) return;

        // Scene setup
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        camera.position.z = 3;

        renderer = new THREE.WebGLRenderer({ canvas: container, antialias: true, alpha: true });
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.setClearColor(0x000000, 0);

        // Create Earth
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        
        // Earth texture with temperature overlay
        const textureLoader = new THREE.TextureLoader();
        const material = new THREE.MeshPhongMaterial({
            map: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'),
            bumpMap: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png'),
            bumpScale: 0.05,
            specularMap: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-water.png'),
            specular: new THREE.Color('grey')
        });

        earth = new THREE.Mesh(geometry, material);
        scene.add(earth);

        // Atmosphere glow
        const atmosphereGeometry = new THREE.SphereGeometry(1.05, 64, 64);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        scene.add(atmosphere);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        scene.add(directionalLight);

        // Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.rotateSpeed = 0.5;
            controls.enableZoom = true;
            controls.minDistance = 1.5;
            controls.maxDistance = 5;
        }

        // Click interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        container.addEventListener('click', (event) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(earth);

            if (intersects.length > 0) {
                const point = intersects[0].point;
                const lat = Math.asin(point.y / 1) * (180 / Math.PI);
                const lon = Math.atan2(point.x, point.z) * (180 / Math.PI);
                
                console.log(`Clicked on Earth: Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`);
                
                // Add a marker at clicked location
                addWeatherMarker(lat, lon, point);
                
                // Fetch weather for this location
                getWeatherByCoords(lat.toFixed(4), lon.toFixed(4));
            }
        });

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            if (earth) {
                earth.rotation.y += 0.001; // Slow rotation
            }
            
            // Rotate markers with earth
            weatherMarkers.forEach(marker => {
                marker.rotation.y += 0.001;
            });
            
            if (controls) {
                controls.update();
            }
            
            renderer.render(scene, camera);
        }

        animate();
        earthInitialized = true;
        console.log('✓ 3D Earth view initialized with live weather overlay');

        // Handle resize
        window.addEventListener('resize', () => {
            if (container && camera && renderer) {
                camera.aspect = container.offsetWidth / container.offsetHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.offsetWidth, container.offsetHeight);
            }
        });

    } catch (err) {
        console.error('Failed to initialize 3D Earth:', err);
    }
}

// Add weather marker to 3D globe
function addWeatherMarker(lat, lon, point) {
    // Remove old markers if too many
    if (weatherMarkers.length > 5) {
        const oldMarker = weatherMarkers.shift();
        scene.remove(oldMarker);
    }
    
    // Create marker (small colored sphere)
    const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.8
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Position at clicked point
    marker.position.copy(point);
    marker.position.normalize().multiplyScalar(1.01); // Slightly above surface
    
    scene.add(marker);
    weatherMarkers.push(marker);
    
    console.log(`Added weather marker at Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`);
}

// Update 3D Earth with current weather data
function update3DEarthWeather(weatherData) {
    if (!earthInitialized || !weatherData) return;
    
    currentWeatherData = weatherData;
    
    // Change atmosphere color based on weather condition
    const condition = weatherData.current.condition.text.toLowerCase();
    let atmosphereColor = 0x4488ff; // Default blue
    
    if (condition.includes('rain') || condition.includes('drizzle')) {
        atmosphereColor = 0x5555ff; // Darker blue for rain
    } else if (condition.includes('cloud')) {
        atmosphereColor = 0x888888; // Gray for clouds
    } else if (condition.includes('clear') || condition.includes('sunny')) {
        atmosphereColor = 0xffaa00; // Orange for sunny
    } else if (condition.includes('storm') || condition.includes('thunder')) {
        atmosphereColor = 0x333388; // Dark purple for storms
    }
    
    // Find atmosphere mesh and update color
    scene.children.forEach(child => {
        if (child.geometry && child.geometry.parameters && child.geometry.parameters.radius === 1.05) {
            child.material.color.setHex(atmosphereColor);
            console.log(`Updated atmosphere color based on: ${condition}`);
        }
    });
}

// ===================================================================
// 3. ENHANCED NATURAL LANGUAGE QUERY WITH AI CAPABILITIES
// ===================================================================
async function processNaturalQuery() {
    const input = document.getElementById('nl-query-input');
    if (!input) return;

    const query = input.value.trim().toLowerCase();
    if (!query) {
        alert('Please ask a question about weather!');
        return;
    }

    console.log('Processing natural language query:', query);

    // Enhanced pattern matching with activity-based questions
    let city = null;
    let timeframe = 'current';
    let activityType = null;

    // Extract city names
    const cities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad', 
                    'tokyo', 'london', 'new york', 'paris', 'sydney', 'dubai', 'singapore', 'kanpur'];
    
    for (const c of cities) {
        if (query.includes(c)) {
            city = c.charAt(0).toUpperCase() + c.slice(1);
            break;
        }
    }

    // Extract timeframe
    if (query.includes('tomorrow')) {
        timeframe = 'tomorrow';
    } else if (query.includes('today') || query.includes('now')) {
        timeframe = 'current';
    } else if (query.includes('weekend')) {
        timeframe = 'weekend';
    } else if (query.includes('next week')) {
        timeframe = 'next_week';
    }

    // Detect activity-based questions (trek, picnic, outdoor activities)
    if (query.includes('trek') || query.includes('hiking') || query.includes('climb')) {
        activityType = 'trek';
    } else if (query.includes('picnic') || query.includes('outdoor') || query.includes('park')) {
        activityType = 'outdoor';
    } else if (query.includes('beach') || query.includes('swim')) {
        activityType = 'beach';
    } else if (query.includes('run') || query.includes('jog') || query.includes('exercise')) {
        activityType = 'exercise';
    } else if (query.includes('travel') || query.includes('trip')) {
        activityType = 'travel';
    }

    // If no city mentioned, try to infer from context or ask
    if (!city) {
        // Check if there's a current city loaded
        const currentCityElement = document.getElementById('cityName');
        if (currentCityElement && currentCityElement.textContent !== 'Loading...') {
            city = currentCityElement.textContent.split(',')[0];
        } else {
            alert('Please specify a city in your question. For example: "Can I go on a trek in Mumbai?"');
            return;
        }
    }

    // Fetch weather data
    startPerformanceMonitoring();
    let weatherData;
    try {
        weatherData = await getWeatherWithResponse(city);
    } catch (err) {
        alert('Could not fetch weather data. Please try again.');
        endPerformanceMonitoring();
        return;
    }
    endPerformanceMonitoring();

    // Analyze weather for activity suitability
    if (activityType) {
        const recommendation = analyzeWeatherForActivity(weatherData, activityType, timeframe);
        
        // Show detailed recommendation in a modal or alert
        showActivityRecommendation(city, activityType, recommendation, weatherData);
    } else {
        // Standard weather query
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const response = timeframe === 'tomorrow' 
            ? `Here's the forecast for ${city} tomorrow!` 
            : `Here's the current weather in ${city}!`;
        alert(response);
    }
    
    input.value = '';
}

// Analyze weather suitability for activities
function analyzeWeatherForActivity(weatherData, activityType, timeframe) {
    const current = weatherData.current;
    const temp = current.temp_c;
    const condition = current.condition.text.toLowerCase();
    const windSpeed = current.wind_kph;
    const humidity = current.humidity;
    const cloudCover = current.cloud;
    
    let recommendation = {
        suitable: false,
        score: 0,
        reasons: [],
        tips: []
    };

    // Trek/Hiking analysis
    if (activityType === 'trek') {
        // Ideal conditions: 15-25°C, no rain, low wind
        if (temp >= 15 && temp <= 25) {
            recommendation.score += 30;
            recommendation.reasons.push('✅ Temperature is perfect for trekking');
        } else if (temp < 10) {
            recommendation.score -= 20;
            recommendation.reasons.push('❌ Too cold for comfortable trekking');
            recommendation.tips.push('Carry warm layers and thermals');
        } else if (temp > 30) {
            recommendation.score -= 15;
            recommendation.reasons.push('⚠️ Hot weather - trek early morning');
            recommendation.tips.push('Start before sunrise, carry extra water');
        }

        if (condition.includes('rain') || condition.includes('storm')) {
            recommendation.score -= 40;
            recommendation.reasons.push('❌ Rain makes trails slippery and dangerous');
            recommendation.tips.push('Postpone trek or check forecast again');
        } else if (condition.includes('clear') || condition.includes('sunny')) {
            recommendation.score += 25;
            recommendation.reasons.push('✅ Clear skies - great visibility');
        } else if (condition.includes('cloud')) {
            recommendation.score += 15;
            recommendation.reasons.push('✅ Overcast skies - comfortable trekking');
        }

        if (windSpeed > 30) {
            recommendation.score -= 20;
            recommendation.reasons.push('⚠️ Strong winds - be cautious on ridges');
        } else if (windSpeed < 15) {
            recommendation.score += 10;
            recommendation.reasons.push('✅ Calm winds');
        }

        recommendation.tips.push('Carry first aid kit, GPS device, and sufficient water');
        recommendation.tips.push('Inform someone about your trekking route');
    }

    // Outdoor/Picnic analysis
    else if (activityType === 'outdoor') {
        if (temp >= 18 && temp <= 28) {
            recommendation.score += 30;
            recommendation.reasons.push('✅ Pleasant temperature for outdoor activities');
        } else if (temp < 15 || temp > 32) {
            recommendation.score -= 15;
            recommendation.reasons.push('⚠️ Temperature might be uncomfortable');
        }

        if (condition.includes('rain')) {
            recommendation.score -= 50;
            recommendation.reasons.push('❌ Rain will spoil outdoor plans');
        } else if (condition.includes('clear') || condition.includes('sunny')) {
            recommendation.score += 30;
            recommendation.reasons.push('✅ Perfect sunny weather');
            recommendation.tips.push('Don\'t forget sunscreen and hats');
        }

        if (windSpeed > 25) {
            recommendation.score -= 10;
            recommendation.reasons.push('⚠️ Windy - secure loose items');
        }
    }

    // Beach/Swimming analysis
    else if (activityType === 'beach') {
        if (temp >= 25 && temp <= 35) {
            recommendation.score += 35;
            recommendation.reasons.push('✅ Great beach weather');
        } else if (temp < 25) {
            recommendation.score -= 20;
            recommendation.reasons.push('❌ Too cool for swimming');
        }

        if (condition.includes('rain') || condition.includes('storm')) {
            recommendation.score -= 50;
            recommendation.reasons.push('❌ Unsafe for beach activities');
        } else if (condition.includes('clear') || condition.includes('sunny')) {
            recommendation.score += 30;
            recommendation.reasons.push('✅ Perfect beach day');
        }

        recommendation.tips.push('Apply waterproof sunscreen SPF 50+');
        recommendation.tips.push('Stay hydrated and avoid midday sun');
    }

    // Exercise/Running analysis
    else if (activityType === 'exercise') {
        if (temp >= 15 && temp <= 25) {
            recommendation.score += 30;
            recommendation.reasons.push('✅ Ideal running temperature');
        } else if (temp > 30) {
            recommendation.score -= 20;
            recommendation.reasons.push('⚠️ Hot - exercise early morning or evening');
        }

        if (condition.includes('rain')) {
            recommendation.score -= 20;
            recommendation.reasons.push('⚠️ Wet conditions - indoor exercise recommended');
        }

        if (humidity > 80) {
            recommendation.score -= 15;
            recommendation.reasons.push('⚠️ High humidity - slower pace recommended');
        }

        recommendation.tips.push('Warm up properly and stay hydrated');
    }

    // Travel analysis
    else if (activityType === 'travel') {
        if (!condition.includes('storm') && !condition.includes('heavy rain')) {
            recommendation.score += 30;
            recommendation.reasons.push('✅ Good travel conditions');
        } else {
            recommendation.score -= 30;
            recommendation.reasons.push('⚠️ Check flight/transport status');
        }

        if (temp >= 10 && temp <= 30) {
            recommendation.score += 20;
            recommendation.reasons.push('✅ Comfortable travel weather');
        }

        recommendation.tips.push('Check traffic and transport schedules');
    }

    // Final suitability verdict
    recommendation.suitable = recommendation.score >= 20;
    
    return recommendation;
}

// Show activity recommendation in a better UI
function showActivityRecommendation(city, activityType, recommendation, weatherData) {
    const activityNames = {
        'trek': 'Trekking',
        'outdoor': 'Outdoor Picnic',
        'beach': 'Beach Visit',
        'exercise': 'Outdoor Exercise',
        'travel': 'Travel'
    };

    const activityName = activityNames[activityType] || 'Activity';
    const current = weatherData.current;

    // Create a modal-style message
    let message = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🌤️ ${activityName} WEATHER ANALYSIS\n`;
    message += `📍 Location: ${city}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Current conditions
    message += `🌡️ CURRENT CONDITIONS:\n`;
    message += `   Temperature: ${current.temp_c}°C (Feels like ${current.feelslike_c}°C)\n`;
    message += `   Condition: ${current.condition.text}\n`;
    message += `   Wind Speed: ${current.wind_kph} km/h\n`;
    message += `   Humidity: ${current.humidity}%\n`;
    message += `   Cloud Cover: ${current.cloud}%\n\n`;

    // Verdict
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (recommendation.suitable) {
        message += `✅ VERDICT: GOOD TO GO!\n`;
        message += `Suitability Score: ${recommendation.score}/100\n`;
    } else {
        message += `❌ VERDICT: NOT RECOMMENDED\n`;
        message += `Suitability Score: ${recommendation.score}/100\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Reasons
    if (recommendation.reasons.length > 0) {
        message += `📋 ANALYSIS:\n`;
        recommendation.reasons.forEach(reason => {
            message += `   ${reason}\n`;
        });
        message += `\n`;
    }

    // Tips
    if (recommendation.tips.length > 0) {
        message += `💡 TIPS:\n`;
        recommendation.tips.forEach(tip => {
            message += `   • ${tip}\n`;
        });
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    // Show in alert (could be enhanced with a custom modal)
    alert(message);
    
    // Scroll to weather details
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Helper function to get weather with response
async function getWeatherWithResponse(city) {
    const currentCityElement = document.getElementById('cityName');
    const currentCity = currentCityElement.textContent.split(',')[0];
    
    // If city matches current displayed city, use existing data
    if (currentCity.toLowerCase() === city.toLowerCase()) {
        return {
            current: {
                temp_c: parseFloat(document.querySelector('#temp').textContent),
                feelslike_c: parseFloat(document.querySelector('#feels').textContent),
                condition: {
                    text: document.querySelector('#weather-icon').alt || 'Clear'
                },
                wind_kph: parseFloat(document.querySelector('#wind-speed').textContent),
                humidity: parseFloat(document.querySelector('#humid').textContent),
                cloud: parseFloat(document.querySelector('#cloud_pct').textContent)
            }
        };
    } else {
        // Fetch new data
        await getWeather(city);
        // Wait a bit for UI to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            current: {
                temp_c: parseFloat(document.querySelector('#temp').textContent),
                feelslike_c: parseFloat(document.querySelector('#feels').textContent),
                condition: {
                    text: document.querySelector('#weather-icon').alt || 'Clear'
                },
                wind_kph: parseFloat(document.querySelector('#wind-speed').textContent),
                humidity: parseFloat(document.querySelector('#humid').textContent),
                cloud: parseFloat(document.querySelector('#cloud_pct').textContent)
            }
        };
    }
}

// Handle Enter key in NL query input
document.addEventListener('DOMContentLoaded', () => {
    const nlInput = document.getElementById('nl-query-input');
    if (nlInput) {
        nlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                processNaturalQuery();
            }
        });
    }
});

// ===================================================================
// 4. AUTO DARK/LIGHT THEME BASED ON TIME
// ===================================================================
function autoSetThemeByTime() {
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour < 18;
    
    const currentTheme = localStorage.getItem('theme');
    const autoTheme = isDaytime ? 'light' : 'dark';
    
    // Only auto-set if user hasn't manually set a theme recently
    if (!currentTheme || localStorage.getItem('theme-auto') === 'true') {
        document.documentElement.setAttribute('data-theme', autoTheme);
        localStorage.setItem('theme', autoTheme);
        localStorage.setItem('theme-auto', 'true');
        updateThemeButton(autoTheme);
        console.log(`✓ Auto-set theme to ${autoTheme} based on time (${hour}:00)`);
    }
}

// Update theme button icon
function updateThemeButton(theme) {
    const btn = document.querySelector('.theme-toggle i');
    if (btn) {
        btn.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Manual theme toggle (disables auto mode)
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    localStorage.setItem('theme-auto', 'false'); // Disable auto mode
    updateThemeButton(next);
}

// Check theme every hour for auto-adjustment
setInterval(autoSetThemeByTime, 3600000);

// ===================================================================
// INITIALIZE ALL ADVANCED FEATURES
// ===================================================================
window.addEventListener('load', () => {
    console.log('🚀 Initializing advanced 5G features...');
    
    // Auto theme
    autoSetThemeByTime();
    
    // 3D Earth (delay to ensure canvas is ready)
    setTimeout(() => {
        init3DEarth();
    }, 1500);
    
    console.log('✓ Advanced features initialized');
});

// Export functions for global access
window.processNaturalQuery = processNaturalQuery;
window.toggleTheme = toggleTheme;
window.startPerformanceMonitoring = startPerformanceMonitoring;
window.endPerformanceMonitoring = endPerformanceMonitoring;
window.update3DEarthWeather = update3DEarthWeather;
