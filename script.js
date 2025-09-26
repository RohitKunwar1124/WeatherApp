
let resolvedCityName = null; // set by reverse geocoding when using current location

function getWeather() {
    const apiKey ='fdf740f40da36f20395eee9131393265'
    const city = document.getElementById('city').value;

    if (city) {
        // If a city is provided, fetch weather by city name
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;
        
        fetchData(currentWeatherUrl, forecastUrl);
    } else {
        // If no city is provided, prompt the user to enter a city
        alert('Please enter a city');
    }
}

// Add this new function to your JavaScript
function fetchData(currentWeatherUrl, forecastUrl) {
    fetch(currentWeatherUrl)
        .then(response => response.json())
        .then(data => {
            displayWeather(data);
        })
        .catch(error => {
            console.error('Error fetching current weather data:', error);
            alert('Error fetching current weather data. Please try again.');
        });

    fetch(forecastUrl)
        .then(response => response.json())
        .then(data => {
            displayHourlyForecast(data.list);
            displayDailyForecast(data.list);
            showForecastSections();
        })
        .catch(error => {
            console.error('Error fetching hourly forecast data:', error);
            alert('Error fetching hourly forecast data. Please try again.');
        });
}


function displayWeather(data) {
    const tempDivInfo = document.getElementById('temp-div');
    const cityNameElement = document.getElementById('city-name');
    const descriptionElement = document.getElementById('description');
    const windElement = document.getElementById('wind');
    const humidityElement = document.getElementById('humidity');
    const weatherIcon = document.getElementById('weather-icon');
    const hourlyForecastDiv = document.getElementById('hourly-forecast');
    const dailyItemsDiv = document.getElementById('daily-items');

    // Clear previous content
    cityNameElement.textContent = '';
    descriptionElement.textContent = '';
    windElement.textContent = '';
    humidityElement.textContent = '';
    hourlyForecastDiv.innerHTML = '';
    dailyItemsDiv.innerHTML = '';
    tempDivInfo.innerHTML = '';

    if (data.cod === '404') {
        cityNameElement.textContent = data.message;
        hideForecastSections();
    } else {
        const cityName = resolvedCityName || data.name;
        const temperature = Math.round(data.main.temp); // Already metric when units=metric
        const description = data.weather[0].description;
        const windSpeed = data.wind.speed;
        const humidity = data.main.humidity;
        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

        cityNameElement.textContent = cityName;
        descriptionElement.textContent = description;
        windElement.textContent = `Wind: ${windSpeed} m/s`;
        humidityElement.textContent = `Humidity: ${humidity}%`;

        const temperatureHTML = `
            <p>${temperature}°C</p>
        `;

        tempDivInfo.innerHTML = temperatureHTML;
        weatherIcon.src = iconUrl;
        weatherIcon.alt = description;

        showImage();
        // Reset after use so manual city searches are not affected
        resolvedCityName = null;
    }
}

function displayHourlyForecast(hourlyData) {
    const hourlyForecastDiv = document.getElementById('hourly-forecast');

    const next24Hours = hourlyData.slice(0, 8); // Display the next 24 hours (3-hour intervals)

    next24Hours.forEach(item => {
        const dateTime = new Date(item.dt * 1000); // Convert timestamp to milliseconds
        const hour = dateTime.getHours();
        const temperature = Math.round(item.main.temp); // Already metric when units=metric
        const iconCode = item.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

        const hourlyItemHtml = `
            <div class="hourly-item">
                <span>${hour}:00</span>
                <img src="${iconUrl}" alt="Hourly Weather Icon">
                <span>${temperature}°C</span>
            </div>
        `;

        hourlyForecastDiv.innerHTML += hourlyItemHtml;
    });
}

function displayDailyForecast(forecastData) {
    const dailyItemsDiv = document.getElementById('daily-items');
    dailyItemsDiv.innerHTML = '';

    // Group forecast data by day
    const dailyData = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    forecastData.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        if (!dailyData[dayKey]) {
            dailyData[dayKey] = {
                date: date,
                temps: [],
                weather: [],
                icons: []
            };
        }
        
        dailyData[dayKey].temps.push(item.main.temp);
        dailyData[dayKey].weather.push(item.weather[0].description);
        dailyData[dayKey].icons.push(item.weather[0].icon);
    });

    // Get the next 7 days
    const next7Days = Object.values(dailyData).slice(0, 7);

    next7Days.forEach((dayData, index) => {
        const date = dayData.date;
        const isToday = date.toDateString() === today.toDateString();
        
        // Calculate min/max temperatures
        const minTemp = Math.round(Math.min(...dayData.temps));
        const maxTemp = Math.round(Math.max(...dayData.temps));
        
        // Get the most common weather condition for the day
        const weatherCounts = {};
        dayData.weather.forEach(weather => {
            weatherCounts[weather] = (weatherCounts[weather] || 0) + 1;
        });
        const mostCommonWeather = Object.keys(weatherCounts).reduce((a, b) => 
            weatherCounts[a] > weatherCounts[b] ? a : b
        );
        
        // Get the most common icon for the day
        const iconCounts = {};
        dayData.icons.forEach(icon => {
            iconCounts[icon] = (iconCounts[icon] || 0) + 1;
        });
        const mostCommonIcon = Object.keys(iconCounts).reduce((a, b) => 
            iconCounts[a] > iconCounts[b] ? a : b
        );
        
        const iconUrl = `https://openweathermap.org/img/wn/${mostCommonIcon}@2x.png`;
        
        // Format date
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dailyItemHtml = `
            <div class="daily-item ${isToday ? 'today' : ''}">
                <div class="daily-date">
                    ${dayName}<br>
                    <small>${monthDay}</small>
                </div>
                <div class="daily-temps">
                    <span class="daily-high">${maxTemp}°</span>
                    <span class="daily-low">${minTemp}°</span>
                </div>
                <img class="daily-icon" src="${iconUrl}" alt="Daily Weather Icon">
                <div class="daily-desc">${mostCommonWeather}</div>
            </div>
        `;

        dailyItemsDiv.innerHTML += dailyItemHtml;
    });
}

function showImage() {
    const weatherIcon = document.getElementById('weather-icon');
    weatherIcon.style.display = 'block'; 
}


function getCurrentLocationWeather() {
    if (navigator.geolocation) {
        const locationButton = document.querySelector('.location-button');
        const originalText = locationButton.textContent;
        locationButton.textContent = 'Getting location...';
        locationButton.disabled = true;

        const apiKey = 'fdf740f40da36f20395eee9131393265';

        navigator.geolocation.getCurrentPosition(
            position => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                resolveCityName(latitude, longitude, apiKey).finally(() => {
                    getWeatherByCoordinates(latitude, longitude, apiKey);
                    locationButton.textContent = originalText;
                    locationButton.disabled = false;
                });
            },
            error => {
                console.error('Error getting current location:', error);
                locationButton.textContent = originalText;
                locationButton.disabled = false;
                
                let errorMessage = 'Error getting current location. ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Please allow location access and try again.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location unavailable. Please try again.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Request timed out. Please try again.';
                        break;
                    default:
                        errorMessage += 'Please try again.';
                        break;
                }
                alert(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    } else {
        alert('Geolocation is not supported by your browser. Please use the city search instead.');
    }
}



function getWeatherByCoordinates(latitude, longitude, apiKey) {
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
    
    fetchData(currentWeatherUrl, forecastUrl);
}


function resolveCityName(lat, lon, apiKey) {
    console.log(`Resolving location for coordinates: ${lat}, ${lon}`);
    
    
    return fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`)
        .then(r => r.json())
        .then(nominatimData => {
            if (nominatimData && nominatimData.address) {
                const addr = nominatimData.address;
                
                const city = addr.city || addr.town || addr.village || addr.county || addr.district || addr.municipality;
                const state = addr.state;
                const country = addr.country;
                
                
                let finalCity = city;
                if (city && city.toLowerCase().includes('kashipur') && state && state.toLowerCase().includes('uttarakhand')) {
                    
                    finalCity = 'Dehradun'; 
                }
                
                const nameParts = [finalCity, state].filter(Boolean);
                resolvedCityName = nameParts.join(', ');
                console.log(`Nominatim resolved to: ${resolvedCityName}`);
                
                if (resolvedCityName) return;
            }
            
            
            const owUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
            return fetch(owUrl)
                .then(r => r.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        const g = data[0];
                        let cityName = g.name;
                        
                        
                        if (cityName && cityName.toLowerCase().includes('kashipur') && g.state && g.state.toLowerCase().includes('uttarakhand')) {
                            cityName = 'Dehradun';
                        }
                        
                        const nameParts = [cityName, g.state].filter(Boolean);
                        resolvedCityName = nameParts.join(', ');
                        console.log(`OpenWeather resolved to: ${resolvedCityName}`);
                    } else {
                        resolvedCityName = null;
                    }
                })
                .catch(() => { resolvedCityName = null; });
        })
        .catch(() => { 
            resolvedCityName = null; 
        });
}


function showForecastSections() {
    const forecastTabs = document.getElementById('forecast-tabs');
    const hourlyForecast = document.getElementById('hourly-forecast');
    
    
    forecastTabs.style.display = 'flex';
    hourlyForecast.style.display = 'grid';
}


function hideForecastSections() {
    const forecastTabs = document.getElementById('forecast-tabs');
    const hourlyForecast = document.getElementById('hourly-forecast');
    const dailyForecast = document.getElementById('daily-forecast');
    
    
    forecastTabs.style.display = 'none';
    hourlyForecast.style.display = 'none';
    dailyForecast.style.display = 'none';
}


function showHourlyForecast() {
    const hourlyTab = document.getElementById('hourly-tab');
    const dailyTab = document.getElementById('daily-tab');
    const hourlyForecast = document.getElementById('hourly-forecast');
    const dailyForecast = document.getElementById('daily-forecast');
    
    
    hourlyTab.classList.add('active');
    dailyTab.classList.remove('active');
    
    
    hourlyForecast.style.display = 'grid';
    dailyForecast.style.display = 'none';
}

function showDailyForecast() {
    const hourlyTab = document.getElementById('hourly-tab');
    const dailyTab = document.getElementById('daily-tab');
    const hourlyForecast = document.getElementById('hourly-forecast');
    const dailyForecast = document.getElementById('daily-forecast');
    
    dailyTab.classList.add('active');
    hourlyTab.classList.remove('active');
    
    hourlyForecast.style.display = 'none';
    dailyForecast.style.display = 'block';
}
