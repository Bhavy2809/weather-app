const url = 'https://weatherapi-com.p.rapidapi.com/forecast.json?q=';
const options = {
	method: 'GET',
	headers: {
		'x-rapidapi-key': '71c8f7cb35msh3d625ea9cc2f194p177104jsne3e4cf1850c2',
		'x-rapidapi-host': 'weatherapi-com.p.rapidapi.com'
	}
};
async function getWeather(city) {
    try {
        cityName.innerHTML=city;
	const response = await fetch(url+city, options);
	const result = await response.json();
	console.log(result);
   

document.querySelector("#temp").innerHTML=result.current.temp_c;
document.querySelector("#cloud_pct").innerHTML=result.current.cloud;
document.querySelector("#humid").innerHTML=result.current.humidity;
document.querySelector("#maxt").innerHTML=result.forecast.forecastday[0].day.maxtemp_c;
document.querySelector("#mint").innerHTML=result.forecast.forecastday[0].day.mintemp_c;
document.querySelector("#sunrise").innerHTML=result.forecast.forecastday[0].astro.sunrise;
document.querySelector("#sunset").innerHTML=result.forecast.forecastday[0].astro.sunset;
document.querySelector("#feels").innerHTML=result.current.feelslike_c;
document.querySelector("#wind-speed").innerHTML=result.current.wind_kph;
document.querySelector("#wind-degree").innerHTML=result.current.wind_degree;
} catch (error) {
	console.error(error);
}
}
submit.addEventListener("click",(e)=>{
    e.preventDefault()
    getWeather(city.value)

})
getWeather("Kanpur")
