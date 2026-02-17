let currentCity = 'istanbul';
let langData = {}; // بعداً از فایل زبان پر می‌شه

function loadWeather(city = 'istanbul') {
  fetch(`../backend/api/weather.php?city=${city}`)
    .then(res => {
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        return res.text().then(txt => { throw new Error('Non-JSON response: ' + txt); });
      }
      return res.json();
    })
    .then(data => {
      if (data.error) {
        console.error('API Error:', data.message, data.raw || '');
        return;
      }
      console.log(data);

      if (data.current && data.current.aqi) {
        renderaqi(data.current.aqi);
      }

      if (Array.isArray(data.hourly)) {
        renderHourly(data.hourly);
      }

      if (Array.isArray(data.daily)) {
        renderDaily(data.daily);
      }

      displayWeatherData(data);

      if (data.location && data.location.lat && data.location.lon) {
        if (typeof updateMapPosition === 'function') {
          updateMapPosition(
            data.location.lat,
            data.location.lon,
            data.location.name
          );
        }
      }
    })
    .catch(err => console.error('Fetch error:', err));
}
function displayWeatherData(data) {

  if (!data || !data.current) return;

  const current = data.current;

  const tempElement = document.getElementById('current-temp');
  const conditionElement = document.getElementById('current-condition');
  const iconElement = document.getElementById('current-icon');
  const windElement = document.querySelector('.wind');
  const humidityElement = document.querySelector('.humidity');
  const cityElement = document.getElementById('current-city');
  const info = getWeatherInfo(current.weather_code, currentLang);

  if (cityElement && data.location) {
    cityElement.textContent = `${data.location.name}, ${data.location.country}`;
  }

  if (tempElement)
    tempElement.textContent = `${Math.round(current.temp)}°C`;

  if (conditionElement)
    conditionElement.textContent = info.text;

  if (iconElement)
    iconElement.innerHTML = `<div style="font-size:4rem;">${info.icon}</div>`;

  if (windElement)
    windElement.textContent = `Wind: ${current.wind} km/h`;

  if (humidityElement)
    humidityElement.textContent = `Humidity: ${current.humidity}%`;

  // 🔊 sync sound
  updateWeatherCode(current.weather_code);

  // 🕒 Forecast
  if (data.hourly) displayHourlyForecast(data.hourly);
  if (data.daily) displayDailyForecast(data.daily);
}
function renderaqi(aqi) {

  const container = document.getElementById('aqi');
  container.innerHTML = '';
  if (!aqi || aqi.value === undefined || aqi.value === null) {
    container.innerHTML = "<div>اطلاعات کیفیت هوا موجود نیست</div>";
    return;
  }
  else {
    container.innerHTML = `
  
      <div class="aqi-value">${aqi.value}</div>
      <div class="aqi-level">${aqi.level}</div>
 
  `;
  }
}

function renderHourly(hours = []) {
  const container = document.getElementById('hourly');
  container.innerHTML = '';

  if (!hours.length) {
    container.innerHTML = '<div>ساعتی موجود نیست</div>';
    return;
  }
  else {
    hours.forEach(hour => {
      const info = getWeatherInfo(hour.weather_code);

      container.innerHTML += `
      <div class="hour">
        <div class="hour-time">${hour.time}</div>
        <div class="hour-icon">${info.icon}</div>
        <div class="hour-temp">${hour.temp}°</div>
      </div>
    `;
    });
  }
}


function renderDaily(days = []) {
  const container = document.getElementById('daily');
  container.innerHTML = '';

  if (!days.length) {
    container.innerHTML = '<div>پیش‌بینی روزانه موجود نیست</div>';
    return;
  }

  days.forEach((day, index) => {
    const info = getWeatherInfo(day.weather_code);

    container.innerHTML += `
      <div class="day-card ${index === 0 ? 'active' : ''}">
        <div class="day-name">${day.name}</div>
        <div class="day-temp">${day.temp}°</div>
        <div class="day-icon">${info.icon}</div>
      </div>
    `;
  });
}
function renderDaily(days) {
  const container = document.getElementById('daily');
  container.innerHTML = '';

  days.forEach((day, index) => {
    const info = getWeatherInfo(day.weather_code);

    container.innerHTML += `
      <div class="day-card ${index === 0 ? 'active' : ''}">
        <div class="day-name">${day.name}</div>
        <div class="day-temp">${day.temp}°</div>
        <div class="day-icon">${info.icon}</div>
      </div>
    `;
  });
}
// بار اول
loadWeather();

// هر 10 دقیقه
setInterval(() => {
  loadWeather();
}, 600000);