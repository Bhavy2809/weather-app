// ⚠️ IMPORTANT: Apni API key yahan daalo
const API_KEY = '71c8f7cb35msh3d625ea9cc2f194p177104jsne3e4cf1850c2';

const url = 'https://weatherapi-com.p.rapidapi.com/forecast.json?q=';
const options = {
    method: 'GET',
    headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'weatherapi-com.p.rapidapi.com'
    }
};

// Function to update background video based on weather condition
function updateBackgroundVideo(condition) {
    const videoElement = document.getElementById('background-video');
    const sourceElement = videoElement.querySelector('source');
    const conditionText = condition.toLowerCase();

    if (conditionText.includes('rain') || conditionText.includes('drizzle')) {
        sourceElement.src = 'videos/rain.mp4';
    } else if (conditionText.includes('sun') || conditionText.includes('clear')) {
        sourceElement.src = 'videos/sunny.mp4';
    } else if (conditionText.includes('cloud') || conditionText.includes('overcast')) {
        sourceElement.src = 'videos/clouds.mp4';
    } else if (conditionText.includes('mist') || conditionText.includes('fog')) {
        sourceElement.src = 'videos/fog.mp4';
    } else {
        sourceElement.src = 'videos/default.mp4'; // Default video
    }

    videoElement.load(); // Load the new video
}

// Function to fetch weather for the main city
async function getWeather(city) {
    cityName.innerHTML = "Loading...";
    try {
        const response = await fetch(url + city, options);
        if (!response.ok) {
            throw new Error('City not found');
        }
        const result = await response.json();
        console.log(result);

        cityName.innerHTML = city;

        // Update main weather cards
        document.querySelector("#temp").innerHTML = result.current.temp_c;
        document.querySelector("#weather-icon").src = result.current.condition.icon;
        document.querySelector("#cloud_pct").innerHTML = result.current.cloud;
        document.querySelector("#humid").innerHTML = result.current.humidity;
        document.querySelector("#maxt").innerHTML = result.forecast.forecastday[0].day.maxtemp_c;
        document.querySelector("#mint").innerHTML = result.forecast.forecastday[0].day.mintemp_c;
        document.querySelector("#sunrise").innerHTML = result.forecast.forecastday[0].astro.sunrise;
        document.querySelector("#sunset").innerHTML = result.forecast.forecastday[0].astro.sunset;
        document.querySelector("#feels").innerHTML = result.current.feelslike_c;
        document.querySelector("#wind-speed").innerHTML = result.current.wind_kph;
        document.querySelector("#wind-degree").innerHTML = result.current.wind_degree;

        // Update the background video
        updateBackgroundVideo(result.current.condition.text);

    } catch (error) {
        console.error(error);
        alert('City not found. Please try again.');
        cityName.innerHTML = "Not Found";
    }
}

// Function to fetch weather for the table
const fetchWeatherForOtherCities = async () => {
    const cities = ['Lucknow', 'Hyderabad', 'Pune', 'Jaipur'];
    const tableBody = document.querySelector(".table tbody");
    tableBody.innerHTML = "<tr><td colspan='6'>Loading...</td></tr>"; // Loading state

    let tableHTML = "";
    for (const city of cities) {
        try {
            const response = await fetch(url + city, options);
            const result = await response.json();

            tableHTML += `
                <tr>
                    <th scope="row" class="text-start">${city}</th>
                    <td>${result.current.temp_c}</td>
                    <td>${result.current.feelslike_c}</td>
                    <td>${result.current.humidity}</td>
                    <td>${result.current.wind_kph}</td>
                    <td>${result.current.condition.text}</td>
                </tr>
            `;
        } catch (error) {
            console.error(`Could not fetch weather for ${city}`);
        }
    }
    tableBody.innerHTML = tableHTML;
};


// Event listener for the search button
submit.addEventListener("click", (e) => {
    e.preventDefault();
    getWeather(city.value);
});

// Event listener for dropdown city links
const dropdownCities = document.querySelectorAll('.dropdown-item');
dropdownCities.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const city = e.target.innerHTML;
        getWeather(city);
    });
});

// Initial function calls when the page loads
getWeather("Kanpur");
fetchWeatherForOtherCities();