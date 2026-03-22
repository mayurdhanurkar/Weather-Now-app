console.log("lets make an weather app")
let currentUnit = "C"    
let lastWeatherData = null  

const activeItems = ["text-cyan-400", "font-medium"]
const inactiveItems = ["text-white/60", "hover:text-white", "transition-colors", "duration-300"]
const navItems = document.querySelectorAll("#navItems a")
navItems.forEach((a) => {
    a.addEventListener("click", () => {
        navItems.forEach((navItem) => {
            navItem.classList.remove(...activeItems)
            navItem.classList.add(...inactiveItems)
        })
        a.classList.add(...activeItems)
        a.classList.remove(...inactiveItems)
    })
})

function degreesToDirection(degrees) {
const directions = ["North", "Northeast", "East", "Southeast",
"South", "Southwest", "West", "Northwest"];
const index = Math.round(degrees / 45) % 8;
return directions[index];
}

function updateUi(data) {
    document.getElementById("city-name").textContent = data.name
    document.getElementById("temperature").textContent = `${Math.round (convertTemp(data.main.temp))}°${currentUnit}`
    document.getElementById("condition").textContent = data.weather[0].main
    document.getElementById("condition-desc").textContent = data.weather[0].description
    document.getElementById("icon").innerHTML = `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">`
    document.getElementById("feels-like").textContent = `${Math.round (convertTemp(data.main.feels_like))}°${currentUnit}`
    document.getElementById("humidity").textContent = data.main.humidity
    document.getElementById("windspeed").textContent = data.wind.speed
    document.getElementById("visibility").textContent = data.visibility
    document.getElementById("pressure").textContent = data.main.pressure
    document.getElementById("sunrise").textContent = new Date(data.sys.sunrise * 1000).toLocaleTimeString()
    document.getElementById("sunset").textContent = new Date(data.sys.sunset * 1000).toLocaleTimeString()
    document.getElementById("cloud-cover").textContent = data.clouds.all
    document.getElementById("date-time").textContent = new Date().toLocaleString()
    document.getElementById("country").textContent = new Intl.DisplayNames(['en'], { type: 'region' }).of(data.sys.country)
    document.getElementById("direction").textContent = degreesToDirection(data.wind.deg)
}

//get current location
function getCurrentlocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position)=>{
            const lat = position.coords.latitude
            const lon = position.coords.longitude
            fetchCoordinates(lat, lon)
        },
        (err)=>{
            console.error("location denied", err.message)
            fetchWeather("Nagpur")
        }
    )
    }else {
    // Browser doesn't support geolocation at all
    fetchWeather("Nagpur") // fallback again
  }
}
async function fetchCoordinates(lat, lon) {
    document.getElementById("city-name").textContent = "Getting Current Location...";
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=c4fbd8b1a5036f127ec1aaf5087d0b26&units=metric`)
        const data = await res.json()
        if (!res.ok) {  // 👈 catches 404, 401, 500, etc.
        throw new Error(data.message); // "city not found"
        }
        lastWeatherData = data;
        updateUi(data)
        saveSearches(data.name)
        loadSearches() 
    } catch (err) {
        console.error("Coords fetch failed:", err.message)
        fetchWeather("Nagpur") 
    }
}
getCurrentlocation()

async function fetchWeather(city) {
    document.getElementById("city-name").textContent = "Loading...";
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=c4fbd8b1a5036f127ec1aaf5087d0b26&units=metric`)
        const data = await res.json()
        if (!res.ok) {  // 👈 catches 404, 401, 500, etc.
        throw new Error(data.message); // "city not found"
        }
        updateUi(data)
        saveSearches(data.name)
        loadSearches() 
        lastWeatherData = data; 
    } catch (err) {
        console.error("error",err)
        const fields = ["temperature", "condition", "humidity", "windspeed", "condition-desc","icon", "direction", "feels-like", "visibility", "pressure", "sunrise", "sunset", "cloud-cover"]
        fields.forEach(id  =>{
            document.getElementById(id).textContent = "-"
        })
        document.getElementById("city-name").textContent = `❌ ${err.message}`;
    }
}


const citySearch = document.getElementById("city-search")
const searchBtn = document.getElementById("search-btn")
citySearch.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
        const city = citySearch.value.trim()
        if (city) {
            fetchWeather(city)
        }
    }
})
searchBtn.addEventListener("click", ()=>{
    const city = citySearch.value.trim()
    if (city) {
        fetchWeather(city)
    }
})

function saveSearches(city) {
    let searches = JSON.parse(localStorage.getItem("searches")) || []
    searches = searches.filter(c => c !== city )
    searches.unshift(city)
    searches = searches.slice(0,5)
    localStorage.setItem("searches", JSON.stringify(searches))
}
function loadSearches() {
    const searches = JSON.parse(localStorage.getItem("searches")) || []
    const container = document.getElementById("recent-searches")
    container.innerHTML = ""
    searches.forEach(search =>{
        const button = document.createElement("button");
        button.textContent = search
        button.addEventListener("click", ()=>{
            fetchWeather(search)
        })
        container.appendChild(button)
    })
}
loadSearches()

function convertTemp(tempInCelsius) {
    if (currentUnit === "C") return tempInCelsius
    return ((tempInCelsius* 9/5)+32)
}
document.getElementById("unit-toggle").addEventListener("click", ()=>{
    if (!lastWeatherData) return
    currentUnit = currentUnit === "C" ? "F" : "C"
    updateUi(lastWeatherData)
    
    const cBtn = document.getElementById("toggle-c")
    const fBtn = document.getElementById("toggle-f")
    if (currentUnit === "C") {
        cBtn.classList.add("bg-white", "text-gray-900")
        cBtn.classList.remove("text-white/60")
        fBtn.classList.add("text-white/60")
        fBtn.classList.remove("bg-white", "text-gray-900")
    } else {
        fBtn.classList.add("bg-white", "text-gray-900")
        fBtn.classList.remove("text-white/60")
        cBtn.classList.remove("bg-white", "text-gray-900")
        cBtn.classList.add("text-white/60")
    }
})