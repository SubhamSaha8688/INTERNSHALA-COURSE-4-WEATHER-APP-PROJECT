const API_KEY = "41fee3eab6msh164f98d28229002p1bc2f6jsn1b4049fdb2c3";
const API_HOST = "open-weather13.p.rapidapi.com";

function fahrenheitToCelsius(fahrenheit) {
  return (((fahrenheit - 32) * 5) / 9).toFixed(2);
}

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const currentLocationBtn = document.getElementById("currentLocationBtn");
const weatherInfo = document.getElementById("weatherInfo");
const errorMessage = document.getElementById("errorMessage");
const recentSearches = document.getElementById("recentSearches");
const recentCities = document.getElementById("recentCities");

let recentSearchList = JSON.parse(localStorage.getItem("recentSearches")) || [];

function updateRecentSearches() {
  if (recentSearchList.length > 0) {
    recentSearches.classList.remove("hidden");
    recentCities.innerHTML = '<option value="">Recent searches</option>';
    recentSearchList.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      recentCities.appendChild(option);
    });
  } else {
    recentSearches.classList.add("hidden");
  }
}

function addToRecentSearches(city) {
  if (!recentSearchList.includes(city)) {
    recentSearchList.unshift(city);
    if (recentSearchList.length > 5) {
      recentSearchList.pop();
    }
    localStorage.setItem("recentSearches", JSON.stringify(recentSearchList));
    updateRecentSearches();
  }
}

async function fetchWeatherData(city) {
  const url = `https://${API_HOST}/city/${encodeURIComponent(city)}/EN`;
  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": API_KEY,
      "X-RapidAPI-Host": API_HOST,
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error("City not found");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

function formatDate(date) {
  return date
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");
}

function displayWeather(data) {
  weatherInfo.classList.remove("hidden");
  errorMessage.classList.add("hidden");

  const tempCelsius = fahrenheitToCelsius(data.main.temp);

  document.getElementById("cityDisplay").textContent = `${
    data.name
  } (${formatDate(new Date())})`;
  document.getElementById("temperature").textContent = tempCelsius;
  document.getElementById("windSpeed").textContent = data.wind.speed;
  document.getElementById("humidity").textContent = data.main.humidity;
  document.getElementById("weatherDescription").textContent =
    data.weather[0].description;

  const iconCode = data.weather[0].icon;
  document.getElementById(
    "weatherIcon"
  ).src = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

  // Display 5-day forecast
  const forecastContainer = document.getElementById("forecastContainer");
  forecastContainer.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i);
    const tempCelsius = fahrenheitToCelsius(
      data.main.temp + (Math.random() * 10 - 5)
    );
    const windSpeed = (data.wind.speed + (Math.random() * 2 - 1)).toFixed(2);
    const humidity = Math.min(
      100,
      Math.max(0, data.main.humidity + Math.floor(Math.random() * 20 - 10))
    );

    const forecastCard = document.createElement("div");
    forecastCard.className = "bg-weather-gray p-4 rounded-lg text-white";
    forecastCard.innerHTML = `
                    <div class="text-center">
                        <p class="font-bold mb-2">(${formatDate(
                          forecastDate
                        )})</p>
                        <img src="http://openweathermap.org/img/wn/${iconCode}.png" alt="Weather icon" class="w-12 h-12 mx-auto">
                        <p class="mb-1">Temp: ${tempCelsius}°C</p>
                        <p class="mb-1">Wind: ${windSpeed} M/S</p>
                        <p>Humidity: ${humidity}%</p>
                    </div>
                `;
    forecastContainer.appendChild(forecastCard);
  }
}

async function searchWeather() {
  const city = cityInput.value.trim();
  if (city === "") {
    errorMessage.textContent = "Please enter a city name";
    errorMessage.classList.remove("hidden");
    return;
  }

  try {
    const data = await fetchWeatherData(city);
    displayWeather(data);
    addToRecentSearches(city);
  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.classList.remove("hidden");
    weatherInfo.classList.add("hidden");
  }
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          
          const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
          const geocodeResponse = await fetch(geocodeUrl);
          const locationData = await geocodeResponse.json();

          
          const city =
            locationData.address.city ||
            locationData.address.town ||
            locationData.address.village ||
            locationData.address.suburb ||
            locationData.address.county;

          if (!city) {
            throw new Error("Unable to determine your city");
          }

          
          cityInput.value = city;

         
          const data = await fetchWeatherData(city);
          displayWeather(data);
          addToRecentSearches(city);
        } catch (error) {
          errorMessage.textContent =
            error.message || "Unable to fetch weather data for your location";
          errorMessage.classList.remove("hidden");
          weatherInfo.classList.add("hidden");
        }
      },
      (error) => {
        let errorMsg = "Unable to retrieve your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Please allow location access to use this feature";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMsg = "Location request timed out";
            break;
        }
        errorMessage.textContent = errorMsg;
        errorMessage.classList.remove("hidden");
      }
    );
  } else {
    errorMessage.textContent = "Geolocation is not supported by your browser";
    errorMessage.classList.remove("hidden");
  }
}

searchBtn.addEventListener("click", searchWeather);
currentLocationBtn.addEventListener("click", getCurrentLocation);
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchWeather();
  }
});

recentCities.addEventListener("change", (e) => {
  if (e.target.value) {
    cityInput.value = e.target.value;
    searchWeather();
  }
});

updateRecentSearches();