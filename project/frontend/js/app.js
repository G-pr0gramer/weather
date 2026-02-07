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
       

  if (Array.isArray(data.hourly)) {
    renderHourly(data.hourly);
  }

  if (Array.isArray(data.daily)) {
    renderDaily(data.daily);
  }
    })
    .catch(err => console.error('Fetch error:', err));
}

function renderHourly(hours = []) {
  const container = document.getElementById('hourly');
  container.innerHTML = '';

  if (!hours.length) {
    container.innerHTML = '<div>ساعتی موجود نیست</div>';
    return;
  }
  else{
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