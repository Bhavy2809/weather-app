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
// 2. 3D EARTH VIEW WITH THREE.JS
// ===================================================================
let scene, camera, renderer, earth, controls;
let earthInitialized = false;

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
                getWeatherByCoords(lat.toFixed(4), lon.toFixed(4));
            }
        });

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            if (earth) {
                earth.rotation.y += 0.001; // Slow rotation
            }
            
            if (controls) {
                controls.update();
            }
            
            renderer.render(scene, camera);
        }

        animate();
        earthInitialized = true;
        console.log('✓ 3D Earth view initialized');

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

// ===================================================================
// 3. NATURAL LANGUAGE QUERY PROCESSING
// ===================================================================
async function processNaturalQuery() {
    const input = document.getElementById('nl-query-input');
    if (!input) return;

    const query = input.value.trim().toLowerCase();
    if (!query) {
        alert('Please enter a question about weather!');
        return;
    }

    console.log('Processing natural language query:', query);

    // Simple pattern matching (can be enhanced with AI later)
    let city = null;
    let timeframe = 'current';

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
    }

    if (city) {
        startPerformanceMonitoring();
        await getWeather(city);
        endPerformanceMonitoring();
        
        // Scroll to results
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Provide natural language response
        const response = timeframe === 'tomorrow' 
            ? `Here's the forecast for ${city} tomorrow!` 
            : `Here's the current weather in ${city}!`;
        
        alert(response);
        input.value = '';
    } else {
        alert('I couldn\'t understand the city name. Try asking like: "What\'s the weather in Mumbai?"');
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
