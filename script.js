console.log("lets make an weather app");
let currentUnit = "C";
let lastWeatherData = null;
let debounceTimer = null  

const activeItems = ["text-cyan-400", "font-medium"];
const inactiveItems = ["text-white/60", "hover:text-white", "transition-colors", "duration-300"];
const navItems = document.querySelectorAll("#navItems a");
navItems.forEach((a) => {
  a.addEventListener("click", () => {
    navItems.forEach((navItem) => {
      navItem.classList.remove(...activeItems);
      navItem.classList.add(...inactiveItems);
    });
    a.classList.add(...activeItems);
    a.classList.remove(...inactiveItems);
  });
});

function degreesToDirection(degrees) {
  const directions = [
    "North",
    "Northeast",
    "East",
    "Southeast",
    "South",
    "Southwest",
    "West",
    "Northwest",
  ];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

function updateUi(data) {
  document.getElementById("city-name").textContent = data.name;
  document.getElementById("temperature").textContent = `${Math.round(convertTemp(data.main.temp))}°${currentUnit}`;
  document.getElementById("condition").textContent = data.weather[0].main;
  document.getElementById("condition-desc").textContent = data.weather[0].description;
  document.getElementById("icon").innerHTML = `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">`;
  document.getElementById("feels-like").textContent = `${Math.round(convertTemp(data.main.feels_like))}°${currentUnit}`;
  document.getElementById("humidity").textContent = data.main.humidity;
  document.getElementById("windspeed").textContent = data.wind.speed;
  document.getElementById("visibility").textContent = data.visibility;
  document.getElementById("pressure").textContent = data.main.pressure;
  document.getElementById("sunrise").textContent = new Date( data.sys.sunrise * 1000, ).toLocaleTimeString();
  document.getElementById("sunset").textContent = new Date( data.sys.sunset * 1000, ).toLocaleTimeString();
  document.getElementById("cloud-cover").textContent = data.clouds.all;
  document.getElementById("date-time").textContent = new Date().toLocaleString();
  document.getElementById("country").textContent = new Intl.DisplayNames(["en"], { type: "region", }).of(data.sys.country);
  document.getElementById("direction").textContent = degreesToDirection(data.wind.deg);
  const conditions = data.weather[0].main;
  const isDay = Date.now()/1000
  applyTheme(conditions, isDay)
}

//get current location
function getCurrentlocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchCoordinates(lat, lon);
      },
      (err) => {
        console.error("location denied", err.message);
        fetchWeather("Nagpur");
      },
    );
  } else {
    // Browser doesn't support geolocation at all
    fetchWeather("Nagpur"); // fallback again
  }
}
async function fetchCoordinates(lat, lon) {
  document.getElementById("city-name").textContent = "Getting Current Location...";
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=c4fbd8b1a5036f127ec1aaf5087d0b26&units=metric`,
    );
    const data = await res.json();
    if (!res.ok) {
      // 👈 catches 404, 401, 500, etc.
      throw new Error(data.message); // "city not found"
    }
    lastWeatherData = data;
    updateUi(data);
    fetchForecast(data.name);
    saveSearches(data.name);
    loadSearches();
  } catch (err) {
    console.error("Coords fetch failed:", err.message);
    fetchWeather("Nagpur");
  }
}
getCurrentlocation();

async function fetchWeather(city) {
  document.getElementById("city-name").textContent = "Loading...";
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=c4fbd8b1a5036f127ec1aaf5087d0b26&units=metric`,
    );
    const data = await res.json();
    if (!res.ok) {
      // 👈 catches 404, 401, 500, etc.
      throw new Error(data.message); // "city not found"
    }
    updateUi(data);
    fetchForecast(data.name);
    saveSearches(data.name);
    loadSearches();
    lastWeatherData = data;
  } catch (err) {
    console.error("error", err);
    const fields = ["temperature", "condition","humidity","windspeed","condition-desc","icon","direction","feels-like","visibility","pressure","sunrise","sunset","cloud-cover",];
    fields.forEach((id) => {
      document.getElementById(id).textContent = "-";
    });
    document.getElementById("city-name").textContent = `❌ ${err.message}`;
  }
}

const citySearch = document.getElementById("city-search");
const searchBtn = document.getElementById("search-btn");
citySearch.addEventListener("input", () => {
    clearTimeout(debounceTimer)
    const city = citySearch.value.trim();
    if (city) {
      if (city.length < 3) return
      debounceTimer = setTimeout(() => {
        fetchWeather(city);
      }, 500);
    }
});
searchBtn.addEventListener("click", () => {
  const city = citySearch.value.trim();
  if (city) {
    fetchWeather(city);
  }
});

function saveSearches(city) {
  let searches = JSON.parse(localStorage.getItem("searches")) || [];
  searches = searches.filter((c) => c !== city);
  searches.unshift(city);
  searches = searches.slice(0, 5);
  localStorage.setItem("searches", JSON.stringify(searches));
}
function loadSearches() {
  const searches = JSON.parse(localStorage.getItem("searches")) || [];
  const container = document.getElementById("recent-searches");
  container.innerHTML = "";
  searches.forEach((search) => {
    const button = document.createElement("button");
    button.textContent = search;
    button.addEventListener("click", () => {
      fetchWeather(search);
    });
    container.appendChild(button);
  });
}
loadSearches();

function convertTemp(tempInCelsius) {
  if (currentUnit === "C") return tempInCelsius;
  return (tempInCelsius * 9) / 5 + 32;
}
document.getElementById("unit-toggle").addEventListener("click", () => {
  if (!lastWeatherData) return;
  currentUnit = currentUnit === "C" ? "F" : "C";
  updateUi(lastWeatherData);

  const cBtn = document.getElementById("toggle-c");
  const fBtn = document.getElementById("toggle-f");
  if (currentUnit === "C") {
    cBtn.classList.add("bg-white", "text-gray-900");
    cBtn.classList.remove("text-white/60");
    fBtn.classList.add("text-white/60");
    fBtn.classList.remove("bg-white", "text-gray-900");
  } else {
    fBtn.classList.add("bg-white", "text-gray-900");
    fBtn.classList.remove("text-white/60");
    cBtn.classList.remove("bg-white", "text-gray-900");
    cBtn.classList.add("text-white/60");
  }
});

async function fetchForecast(city) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=c4fbd8b1a5036f127ec1aaf5087d0b26&units=metric`,
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }
    render5dayforcast(data.list);
    renderHourlyForecast(data.list);
  } catch (err) {
    console.error("Forecast error:", err.message);
  }
}
function render5dayforcast(list) {
  const noonData = list.filter((d) => d.dt_txt.includes("12:00:00")).slice(0, 5);
  const container = document.getElementById("5dayforcast");
  container.innerHTML = "";
  noonData.forEach((item) => {
    const card = document.createElement("div");
    const date = new Date(item.dt * 1000);
    const dayName = date.toLocaleDateString("en", { weekday: "short" });
    const dayDate = date.toLocaleDateString("en", { day: "numeric", month: "short" });

    card.innerHTML = `
          <div class="grid grid-cols-4 items-center justify-between border-b border-white/10 last:border-0 px-8 py-5 hover:bg-white/3 transition-colors duration-200">
            <div class="w-32">
              <p class="font-semibold">${dayName}</p>
              <p class="text-xs text-white/30">${dayDate}</p>
            </div>
            <div class="flex items-center gap-3 w-44 justify-center">
              <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].main}" class="w-10 h-10"/>
              <span class="text-sm text-white/60">${item.weather[0].description}</span>
            </div>
            <div class="flex items-center gap-3 justify-center">
              <svg class="w-4 h-4 text-indigo-400/60" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c-1.2 2.4-5 7.2-5 10a5 5 0 0010 0c0-2.8-3.8-7.6-5-10z"/>
              </svg>
              <span class="text-sm text-white/40">${Math.round(item.main.humidity)}%</span>
            </div>
            <div class="flex items-center gap-4 justify-end">
              <span class="text-lg font-bold">${Math.round(convertTemp(item.main.temp))}°</span>
              <span class="text-lg text-white/30">${Math.round(convertTemp(item.main.temp_min))}°</span>
            </div>
          </div>
        `;
    container.appendChild(card);
  });
}
function renderHourlyForecast(list) {
  const hourlyData = list.slice(0, 10);
  const container = document.getElementById("hourForcast");
  container.innerHTML = "";

  hourlyData.forEach((item, index) => {
    const card = document.createElement("div");
    const isFirst = index === 0;
    const time = new Date(item.dt * 1000);
    const timeLabel = isFirst
      ? "Now"
      : time.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });

    if (isFirst) {
      card.innerHTML = `
        <div class="min-w-25 shrink-0 rounded-2xl bg-linear-to-b from-cyan-500/20 to-transparent border border-cyan-400/20 p-4 flex flex-col items-center gap-2">
          <span class="text-xs text-cyan-400 font-semibold">${timeLabel}</span>
          <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="icon" class="w-8 h-8"/>
          <span class="text-lg font-bold">${Math.round(convertTemp(item.main.temp))}°${currentUnit}</span>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="min-w-25 shrink-0 rounded-2xl bg-white/4 border border-white/6 p-4 flex flex-col items-center gap-2 hover:bg-white/7 transition-colors duration-200">
          <span class="text-xs text-white/40">${timeLabel}</span>
          <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="icon" class="w-8 h-8"/>
          <span class="text-lg font-bold">${Math.round(convertTemp(item.main.temp))}°${currentUnit}</span>
        </div>
      `;
    }

    container.appendChild(card);
  });
}

function applyTheme(condition, isDay) {
  const themes = {
    Clear: isDay ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      : "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",

    Clouds: isDay ? "linear-gradient(to top, #a0aec0, #475569)"
      : "linear-gradient(to top, #232526, #414345)",

    Rain: isDay ? "linear-gradient(to top, #667db6, #0082c8, #0082c8, #667db6)"
      : "linear-gradient(to top, #373b44, #4286f4)",

    Snow: isDay ? "linear-gradient(to top, #e6dada, #274046)"
      : "linear-gradient(to top, #83a4d4, #b6fbff)",

    Thunderstorm: isDay ? "linear-gradient(to top, #141e30, #243b55)"
      : "linear-gradient(to top, #000000, #434343)",

    Mist: isDay ? "linear-gradient(to top, #606c88, #3f4c6b)"
      : "linear-gradient(to top, #757f9a, #d7dde8)",

    Fog: isDay ? "linear-gradient(to top, #bdc3c7, #2c3e50)" 
      : "linear-gradient(to top, #3e5151, #decba4)", 

    Drizzle: isDay ? "linear-gradient(to top, #89f7fe, #66a6ff)" 
      : "linear-gradient(to top, #283e51, #485563)", 

    Haze: isDay ? "linear-gradient(to top, #cbd5e1, #1e293b)" 
      : "linear-gradient(to top, #525252, #b8c76f)", 
  };

  const gradient = themes[condition] || (isDay ? "linear-gradient(to top, #56ccf2, #2f80ed)" : "linear-gradient(to top, #000428, #004e92)" );
  document.body.style.background = gradient
}
