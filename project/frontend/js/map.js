let map = null;
let currentMarker = null;

let defaultCity = {
    name: 'Istanbul',
    lat: 41.0082,
    lon: 28.9784,
    zoom: 8
};

let currentCityCoords = {
    lat: defaultCity.lat,
    lon: defaultCity.lon,
    name: defaultCity.name
};

function getCurrentLang() {
    const activeBtn = document.querySelector('.lang-btn.active');
    return activeBtn ? activeBtn.dataset.lang : 'en';
}

function initWeatherMap() {
    const mapElement = document.getElementById('weather-map');

    if (!mapElement) {
        console.error('❌ المنت نقشه پیدا نشد');
        return;
    }

    map = L.map('weather-map').setView(
        [defaultCity.lat, defaultCity.lon],
        defaultCity.zoom
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    addMarker(defaultCity.lat, defaultCity.lon, defaultCity.name);

    map.on('click', function (e) {
        const { lat, lng } = e.latlng;
        handleMapClick(lat, lng);
    });

    console.log('✅ نقشه با موفقیت بارگذاری شد');
    console.log('📍 شهر پیش‌فرض:', defaultCity.name);
}

function addMarker(lat, lon, cityName) {
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    currentMarker = L.marker([lat, lon]).addTo(map)
        .bindPopup(`📍 ${cityName}`)
        .openPopup();
}

function updateMapPosition(lat, lon, cityName) {
    if (!map) {
        console.warn('⚠️ نقشه هنوز لود نشده');
        return;
    }

    map.setView([lat, lon], 8);

    addMarker(lat, lon, cityName);

    currentCityCoords = {
        lat: lat,
        lon: lon,
        name: cityName
    };

    console.log('✅ نقشه آپدیت شد:', cityName);
}

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        initWeatherMap();
    }, 300);
});

function handleMapClick(lat, lon) {
    addMarker(lat, lon, 'Receiving...');
    fetchWeatherByCoords(lat, lon);
};

async function fetchWeatherByCoords(lat, lng) {
   
    try {
        const response = await fetch(`../backend/api/weather.php?lat=${lat}&lon=${lng}`);
        const data = await response.json();

        if (data.error) {
            alert('danger :' + data.message);
            if (currentMarker) {
                currentMarker.setPopupContent('danger');
            };
            return;
        };

        updateWeatherCard(data);

        if (data.hourly && document.getElementById('hourly')) {
            renderHourly(data.hourly);
        }

        if (data.daily && document.getElementById('daily')) {
            renderDaily(data.daily);
        }

        if (data.current && data.current.aqi && document.getElementById('aqi')) {
            renderaqi(data.current.aqi);
        }

        if (currentMarker) {
            const cityName = data.city|| 'Unknown';
            currentMarker.setPopupContent(`📍 ${cityName}`);
        }

        const weatherCard = document.querySelector('.weather-card');
        if (weatherCard) {
            weatherCard.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }

    } catch (error) {
        console.error('Error:', error);
        alert('❌ خطا در ارتباط با سرور');
    }
};

function updateWeatherCard(data) {
    if (!data || !data.current) return;

    const current = data.current;

    // نام شهر
    const cityElement = document.getElementById('current-city');
    if (cityElement && data.location) {
        cityElement.textContent = `${data.location.name}, ${data.location.country}`;
    }

    // دما
    const tempElement = document.getElementById('current-temp');
    if (tempElement) {
        tempElement.textContent = `${Math.round(current.temp)}°C`;
    }

    // وضعیت جوی
    const conditionElement = document.getElementById('current-condition');
    if (conditionElement) {
        const info = getWeatherInfo(current.weather_code, getCurrentLang());
        conditionElement.textContent = info.text;
    }

    // آیکون
    const iconElement = document.getElementById('current-icon');
    if (iconElement) {
        const info = getWeatherInfo(current.weather_code, getCurrentLang());
        iconElement.innerHTML = `<div style="font-size:4rem;">${info.icon}</div>`;
    }

    // باد
    const windElement = document.querySelector('.wind');
    if (windElement) {
        windElement.textContent = `Wind: ${current.wind} km/h`;
    }
};