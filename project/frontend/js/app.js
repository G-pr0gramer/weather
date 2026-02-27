let currentCity = "istanbul";
let currentLang = {};

function loadWeather(city = "istanbul") {
  currentCity = city;
  fetch(`../backend/api/weather.php?city=${city}`)
    .then((res) => {
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        return res.text().then((txt) => {
          throw new Error("Non-JSON response: " + txt);
        });
      }
      return res.json();
    })
    .then((data) => {
      if (data.error) {
        console.error("API Error:", data.message, data.raw || "");
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
    .catch((err) => console.error("Fetch error:", err));
}

function changeLanguage(lang) {
  currentLang = lang;

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.lang === lang) {
      btn.classList.add("active");
    }
  });

  if (currentCity) {
    loadWeather(currentCity);
  }

  console.log(`Language changed to: ${lang}`);
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    const lang = this.dataset.lang;
    changeLanguage(lang);
  });
});
async function displayWeatherData(data) {
  if (!data || !data.current) return;

  const current = data.current;

  const tempElement = document.getElementById("current-temp");
  const conditionElement = document.getElementById("current-condition");
  const iconElement = document.getElementById("current-icon");
  const windElement = document.querySelector(".wind");
  const humidityElement = document.querySelector(".humidity");
  const cityElement = document.getElementById("current-city");

  const info = getWeatherInfo(current.weather_code, currentLang);

  if (cityElement && data.location) {
    cityElement.textContent = `${data.location.name}, ${data.location.country}`;
  }

  if (tempElement) tempElement.textContent = `${Math.round(current.temp)}°C`;

  if (conditionElement) conditionElement.textContent = info.text;

  if (iconElement)
    iconElement.innerHTML = `<div style="font-size:4rem;">${info.icon}</div>`;

  if (windElement) windElement.textContent = `Wind: ${current.wind} km/h`;

  if (humidityElement)
    humidityElement.textContent = `Humidity: ${current.humidity}%`;

  await updateWeatherCode(current.weather_code);
}
function renderaqi(aqi) {
  const container = document.getElementById("aqi");
  container.innerHTML = "";
  if (!aqi || aqi.value === undefined || aqi.value === null) {
    container.innerHTML = "<div>اطلاعات کیفیت هوا موجود نیست</div>";
    return;
  } else {
    container.innerHTML = `
  
      <div class="aqi-value">${aqi.value}</div>
      <div class="aqi-level">${aqi.level}</div>
 
  `;
  }
}

function renderHourly(hours = []) {
  const container = document.getElementById("hourly");
  container.innerHTML = "";

  if (!hours.length) {
    container.innerHTML = "<div>ساعتی موجود نیست</div>";
    return;
  } else {
    hours.forEach((hour) => {
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

function renderDaily(days) {
  const container = document.getElementById("daily");
  container.innerHTML = "";

  days.forEach((day, index) => {
    const info = getWeatherInfo(day.weather_code);

    container.innerHTML += `
      <div class="day-card ${index === 0 ? "active" : ""}">
        <div class="day-name">${day.name}</div>
        <div class="day-temp">${day.temp}°</div>
        <div class="day-icon">${info.icon}</div>
      </div>
    `;
  });
}

/////////////////////

document.addEventListener("DOMContentLoaded", function () {
  const searchInputs = document.querySelectorAll(".search-input");
  let autocompleteContainer = null;
  let debounceTimer = null;

  function createAutocompleteContainer(targetInput) {
    if (!autocompleteContainer) {
      autocompleteContainer = document.createElement("div");
      autocompleteContainer.className = "autocomplete-container";
      autocompleteContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(26, 43, 60, 0.95);
        border-radius: 15px;
        margin-top: 10px;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1001;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 5px 0;
      `;
      targetInput.parentElement.appendChild(autocompleteContainer);
    }
    return autocompleteContainer;
  }

  function clearAutocomplete() {
    if (autocompleteContainer) {
      autocompleteContainer.innerHTML = "";
      autocompleteContainer.style.display = "none";
    }
  }

  function showSuggestions(cities, targetInput) {
    const container = createAutocompleteContainer(targetInput);
    container.innerHTML = "";

    if (cities.length === 0) {
      container.style.display = "none";
      return;
    }

    container.style.display = "block";

    cities.forEach((city) => {
      const suggestion = document.createElement("div");
      suggestion.className = "autocomplete-item";
      suggestion.style.cssText = `
        padding: 12px 15px;
        cursor: pointer;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
        color: #fff;
        font-size: 1rem;
        display: flex;
        align-items: center;
        gap: 10px;
      `;

      const countryName = getCountryName(city.country);

      suggestion.innerHTML = `
        <span style="font-size: 1.2rem;">📍</span>
        <div style="flex: 1;">
          <div style="font-weight: 500; font-size: 1rem;">${city.name}</div>
          <div style="font-size: 0.85rem; opacity: 0.7; margin-top: 2px;">
            ${city.state ? city.state + " • " : ""}${countryName}
          </div>
        </div>
      `;

      suggestion.onmouseover = () => {
        suggestion.style.background = "rgba(45, 68, 91, 0.8)";
      };

      suggestion.onmouseout = () => {
        suggestion.style.background = "transparent";
      };

      suggestion.onclick = () => {
        targetInput.value = city.name;
        clearAutocomplete();
        if (city.lat && city.lon) {
          if (typeof updateMapPosition === 'function') {
            updateMapPosition(city.lat, city.lon, city.name);
          }
        }
        loadWeather(city.name);
      };

      container.appendChild(suggestion);
    });
  }

  function getCountryName(code) {
    const countries = {
      IR: "Iran",
      US: "United States",
      GB: "United Kingdom",
      FR: "France",
      DE: "Germany",
      IT: "Italy",
      ES: "Spain",
      CA: "Canada",
      AU: "Australia",
      JP: "Japan",
      CN: "China",
      IN: "India",
      BR: "Brazil",
      RU: "Russia",
    };
    return countries[code] || code;
  }

  async function searchCities(query, targetInput) {
    if (query.length < 2) {
      clearAutocomplete();
      return;
    }

    try {
      const url = `../backend/api/city-search.php?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const cities = data.map((item) => ({
        name: item.name,
        country: item.country,
        state: item.state || "",
        lat: item.lat,
        lon: item.lon,
      }));

      const sortedCities = cities.sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase());
        const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase());

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        const aIndex = a.name.toLowerCase().indexOf(query.toLowerCase());
        const bIndex = b.name.toLowerCase().indexOf(query.toLowerCase());

        return aIndex - bIndex;
      });

      showSuggestions(sortedCities, targetInput);
    } catch (error) {
      console.error("Error searching cities:", error);

      const container = createAutocompleteContainer(targetInput);
      container.innerHTML = `
        <div style="padding: 15px; text-align: center; color: #ff6b6b; font-size: 0.9rem;">
          <div>⚠️ Unable to search cities</div>
          <div style="font-size: 0.8rem; margin-top: 5px; opacity: 0.8;">
            Please check your internet connection
          </div>
        </div>
      `;
      container.style.display = "block";
    }
  }

  searchInputs.forEach(input => {
    input.addEventListener("input", function (e) {
      const query = e.target.value.trim();
      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        if (query.length >= 2) {
          console.log("🔍 جستجو برای:", query);
          searchCities(query, input);
        } else {
          clearAutocomplete();
        }
      }, 300);
    });

    input.addEventListener("keypress", function (e) {
      console.log("⌨️ کلید فشرده شد:", e.key);
      if (e.key === "Enter") {
        const city = input.value.trim();
        if (city) {
          console.log("🎯 انتخاب شهر با Enter:", city);
          clearAutocomplete();
          loadWeather(city); // ✅ اینجا باید loadWeather باشه!
        }
      }
    });
  });

  document.addEventListener("click", function (e) {
    const isInput = e.target.closest(".search-input");
    if (!isInput && !autocompleteContainer?.contains(e.target)) {
      clearAutocomplete();
    }
  });

  console.log("City search autocomplete initialized");
});

let isSoundEnabled = true;
let currentWeatherSound = null;
let currentWeatherCode = 800;
let audioInitialized = false;

const weatherSounds = {
  rain: "sounds/rain.mp3",
  thunderstorm: "sounds/thunder.mp3",
  wind: "sounds/wind.mp3",
  snow: "sounds/snow.mp3",
  clear: "sounds/ambience.mp3",
};

async function toggleSound() {
  isSoundEnabled = !isSoundEnabled;

  const soundBtns = document.querySelectorAll(".sound-toggle");

  soundBtns.forEach(btn => {
    if (isSoundEnabled) {
      btn.classList.remove("muted");
      btn.innerHTML = '<span class="sound-icon">🔊</span>';
    } else {
      btn.classList.add("muted");
      btn.innerHTML = '<span class="sound-icon">🔇</span>';
    }
  });

  if (isSoundEnabled) {
    await playWeatherSound(currentWeatherCode);
  } else {
    await stopWeatherSound();
  }
}

async function playWeatherSound(weatherCode) {
  if (!isSoundEnabled) {
    console.log("🔇 صدا غیرفعاله");
    return;
  }

  // if (!audioInitialized) {
  //   try {
  //     const test = new Audio("sounds/ambience.mp3");
  //     test.volume = 0.01;
  //     await test.play();
  //     test.pause();
  //     audioInitialized = true;
  //     console.log("✅ سیستم صدا فعال شد");
  //   } catch (e) {
  //     console.log("⚠️ هنوز اجازه پخش صدا داده نشده.");
  //     return;
  //   }
  // }

  console.log("⏸️ در حال توقف صدای قبلی...");
  await stopWeatherSound();
  console.log("⏹️ صدای قبلی متوقف شد");

  let soundType = "clear";

  if ([500, 501, 502, 503, 504, 511, 520, 521, 522, 531, 61, 63, 65, 80, 81, 82].includes(weatherCode) ||
      [300, 301, 302, 310, 311, 312, 313, 314, 321].includes(weatherCode)) {
    soundType = "rain";
  }
  else if ([200, 201, 202, 210, 211, 212, 221, 230, 231, 232,].includes(weatherCode) ||
           [95, 96, 99].includes(weatherCode)) {
    soundType = "thunderstorm";
  }
  else if ([701, 711, 721, 731, 741, 751, 761, 762, 771, 781].includes(weatherCode) ||
           [90, 91, 92, 93, 94, 98].includes(weatherCode)) {
    soundType = "wind";
  }
  else if ([600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622].includes(weatherCode) ||
           [771, 773].includes(weatherCode)) {
    soundType = "snow";
  }

  const soundUrl = weatherSounds[soundType];
  console.log("🎵 نوع صدا:", soundType);
  console.log("📁 مسیر فایل:", soundUrl);

  if (!soundUrl) {
    console.error("❌ فایل صدا پیدا نشد:", soundType);
    return;
  }

  try {
    console.log(" در حال ایجاد Audio object...");
    currentWeatherSound = new Audio(soundUrl);
    currentWeatherSound.loop = true;
    currentWeatherSound.volume = 0.6;
    
    console.log("▶️ در حال پخش...");
    await currentWeatherSound.play();
    console.log("✅ صدای جدید با موفقیت پخش شد:", soundType);

    currentWeatherSound.addEventListener('error', (e) => {
      console.error("❌ خطا در پخش صدا:", e);
    });
    
  } catch (err) {
    console.error("❌ خطا در پخش صدا:", err.name, err.message);
    if (err.name === 'NotAllowedError') {
      audioInitialized = false;
      console.log("⚠️ نیاز به کلیک کاربر برای پخش صدا");
    }
  }
}

function stopWeatherSound() {
  return new Promise((resolve) => {
    if (currentWeatherSound) {
      console.log("⏸️ توقف صدای فعلی...");
      
      currentWeatherSound.pause();
      currentWeatherSound.currentTime = 0;
      
      const oldSound = currentWeatherSound;
      currentWeatherSound = null;
      
      setTimeout(() => {
        console.log("⏹️ صدای قبلی کاملاً متوقف شد");
        resolve();
      }, 100);
    } else {
      console.log("ℹ️ صدایی در حال پخش نبود");
      resolve();
    }
  });
}

async function updateWeatherCode(code) {
  console.log("🔄 تغییر کد آب‌وهوا به:", code);
  currentWeatherCode = code;

  if (isSoundEnabled) {
    console.log("🎵 تلاش برای پخش صدای جدید...");
    await playWeatherSound(code);
  } else {
    console.log("🔇 صدا خاموش است، پخش انجام نشد");
  }
}

async function initAudioOnFirstInteraction() {
  if (audioInitialized) return;

  console.log("🎵 تلاش برای فعال‌سازی صدا...");

  try {
    const testAudio = new Audio("sounds/ambience.mp3");
    testAudio.volume = 0.01;

    await testAudio.play();

    audioInitialized = true;
    testAudio.pause();
    testAudio.currentTime = 0;

    console.log("✅ سیستم صدا فعال شد!");

    if (isSoundEnabled && currentWeatherCode) {
      playWeatherSound(currentWeatherCode);
    }

  } catch (err) {
    console.log("⚠️ پخش خودکار مسدود شد. خطا:", err.name);
  }
}

document.addEventListener('click', initAudioOnFirstInteraction, { once: true });
document.addEventListener('touchstart', initAudioOnFirstInteraction, { once: true });

console.log("🎧 سیستم صدا آماده است - با اولین کلیک فعال می‌شه");

let isDarkMode = true;

function toggleTheme() {
  isDarkMode = !isDarkMode;

  const themeBtns = document.querySelectorAll(".theme-toggle");

  themeBtns.forEach(btn => {
    if (isDarkMode) {
      btn.innerHTML = '<span class="theme-icon">🌙</span>';
    } else {
      btn.innerHTML = '<span class="theme-icon">☀️</span>';
    }
  });

  document.body.style.backgroundColor = isDarkMode ? "rgb(29, 29, 71)" : "#f5f5f5";
  document.body.style.color = isDarkMode ? "#fff" : "#333";

  document.querySelectorAll(".weather-card, .day-card, .chart-container").forEach((card) => {
    card.style.background = isDarkMode ? "rgba(26, 43, 60, 0.7)" : "rgba(255, 255, 255, 0.9)";
    card.style.color = isDarkMode ? "#fff" : "#333";
  });

  const header = document.querySelector(".main-header");
  if (header) {
    header.style.background = isDarkMode ? "#1a2b3c" : "#fff";
    header.style.color = isDarkMode ? "#fff" : "#333";
    header.style.boxShadow = isDarkMode ? "none" : "0 2px 10px rgba(0, 0, 0, 0.1)";
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const themeBtns = document.querySelectorAll(".theme-toggle");
  themeBtns.forEach(btn => {
    btn.addEventListener("click", toggleTheme);
  });

  const soundBtns = document.querySelectorAll(".sound-toggle");
  soundBtns.forEach(btn => {
    btn.addEventListener("click", toggleSound);
  });

});
console.log("Header features initialized");
// بار اول
loadWeather();

// هر 10 دقیقه
setInterval(() => {
  loadWeather();
}, 600000);

let aqiChartInstance = null;
let aqiPanelOpen = false;

function toggleAQIPanel() {
  const panel = document.querySelector('.aqi-panel');
  aqiPanelOpen = !aqiPanelOpen;

  if (aqiPanelOpen) {
    panel.classList.add('open');
  } else {
    panel.classList.remove('open');
  }
}

async function loadAQIChart() {
  const input = document.getElementById('aqiCityInput').value;
  const loading = document.getElementById('aqiLoading');
  const summaryCards = document.getElementById('aqiSummaryCards');
  const chartContainer = document.getElementById('aqiChartContainer');
  const detailsTable = document.getElementById('aqiDetailsTable');

  if (!input.trim()) {
    alert('Please enter the name of at least one city');
    return;
  }

  const cities = input.split(/[,،و]+/).map(c => c.trim()).filter(c => c);
  console.log('شهرهای وارد شده:', cities);

  if (cities.length === 0) {
    alert('Please enter at least one city');
    return;
  }

  // نمایش لودینگ
  loading.style.display = 'flex';
  summaryCards.style.display = 'none';
  chartContainer.style.display = 'none';
  detailsTable.style.display = 'none';

  const allData = [];
  const errors = [];

  try {
    for (const city of cities) {
      try {
        console.log(`در حال دریافت اطلاعات برای: ${city}`);
        const data = await fetchFromBackend(city);

        if (data && data.current && data.current.aqi) {
          allData.push(data);
          console.log(`✅ داده‌های ${city} دریافت شد:`, data.current.aqi);
        } else {
          errors.push(`${city}: داده‌های AQI موجود نیست`);
          console.warn(`⚠️ داده‌های ناقص برای ${city}:`, data);
        }
      } catch (cityError) {
        console.error(`❌ خطا در دریافت ${city}:`, cityError);
        errors.push(`${city}: ${cityError.message}`);
      }
    }

    if (allData.length === 0) {
      throw new Error('هیچ داده‌ای دریافت نشد.\nخطاها: ' + errors.join(', '));
    }

    console.log('✅ همه داده‌ها:', allData);

    loading.style.display = 'none';

    renderAQISummaryCards(allData);
    summaryCards.style.display = 'grid';

    renderAQIChart(allData);
    chartContainer.style.display = 'block';

    renderAQITable(allData);
    detailsTable.style.display = 'block';

    if (errors.length > 0) {
      console.warn('⚠️ برخی شهرها خطا دادن:', errors);
    }

  } catch (error) {
    loading.style.display = 'none';
    console.error('خطای کلی:', error);
    alert('خطا در دریافت اطلاعات:\n' + error.message);
  }
}

function renderAQISummaryCards(citiesData) {
  const container = document.getElementById('aqiSummaryCards');
  container.innerHTML = '';

  citiesData.forEach(city => {
    const aqiValue = city.current.aqi.value;
    const aqiLevel = city.current.aqi.level;

    let statusClass = aqiValue <= 50 ? 'good' :
      aqiValue <= 100 ? 'moderate' : 'unhealthy';

    const card = `
            <div class="summary-card ${statusClass}">
                <div class="summary-city">${city.city}</div>
                <div class="summary-value">${aqiValue}</div>
                <div class="summary-level">${aqiLevel}</div>
            </div>
        `;
    container.innerHTML += card;
  });
}

function renderAQIChart(citiesData) {
  const ctx = document.getElementById('aqiChart').getContext('2d');

  if (aqiChartInstance) {
    aqiChartInstance.destroy();
  }

  const labels = citiesData.map(d => d.city);
  const values = citiesData.map(d => d.current.aqi.value);

  const bgColors = values.map(val => {
    if (val <= 50) return 'rgba(76, 175, 80, 0.8)';
    if (val <= 100) return 'rgba(255, 152, 0, 0.8)';
    return 'rgba(244, 67, 54, 0.8)';
  });

  aqiChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Air pollution index: (AQI)',
        data: values,
        backgroundColor: bgColors,
        borderColor: bgColors.map(c => c.replace('0.8', '1')),
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 60,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Air Quality Index Comparison',
          color: 'rgba(255, 255, 255, 0.9)',
          font: { size: 16, weight: 'bold' }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 200,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: 'rgba(255, 255, 255, 0.6)' },
          title: {
            display: true,
            text: 'AQI',
            color: 'rgba(255, 255, 255, 0.7)'
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255, 255, 255, 0.6)' }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  });
}

function renderAQITable(citiesData) {
  const tbody = document.getElementById('aqiTableBody');
  tbody.innerHTML = '';

  const recommendations = {
    good: 'Outdoor activities are free',
    moderate: 'The sensitive should be careful',
    unhealthy: 'Reduction in outdoor activity'
  };

  citiesData.forEach(city => {
    const aqiValue = city.current.aqi.value;
    const aqiLevel = city.current.aqi.level.toLowerCase();

    let statusClass = aqiValue <= 50 ? 'good' :
      aqiValue <= 100 ? 'moderate' : 'unhealthy';

    const row = `
            <tr>
                <td><strong>${city.city}</strong></td>
                <td>${aqiValue}</td>
                <td><span class="aqi-badge ${statusClass}">${aqiLevel}</span></td>
                <td>${recommendations[statusClass]}</td>
            </tr>
        `;
    tbody.innerHTML += row;
  });
}

async function fetchFromBackend(cityName) {
  const response = await fetch(`../backend/api/weather.php?city=${cityName}`);
  if (!response.ok) throw new Error(`شهر ${cityName} پیدا نشد`);
  return await response.json();
}

const hamburger = document.getElementById('hamburger');
const navLink = document.querySelector('.nav-link');

function openMenu() {
  hamburger.classList.toggle("active");
  navLink.classList.toggle("active");
  document.body.classList.toggle("menu-open");
}

function closeMenu() {
  hamburger.classList.remove("active");
  navLink.classList.remove("active");
}

var links = document.querySelectorAll('.nav-link a');
for (var i = 0; i < links.length; i++) {
  links[i].onclick = closeMenu;
}

const langDropdowns = [
  { btn: 'langDropdown', options: 'langOptions' },
  { btn: 'langDropdownMobile', options: 'langOptionsMobile' }
];

const flagMap = { fa: 'ir', en: 'gb', tr: 'tr' };
const codeMap = { fa: 'IR', en: 'EN', tr: 'TR' };

function updateFlagDisplay(container, flagCode, langCode) {
  const flagEl = container.querySelector('.fi');
  const codeEl = container.querySelector('.lang-code');

  if (flagEl && flagCode) {
    flagEl.className = 'fi';
    flagEl.classList.add(`fi-${flagCode}`);
  }
  if (codeEl && langCode) {
    codeEl.textContent = langCode;
  }
}

langDropdowns.forEach(({ btn, options }) => {
  const dropdownBtn = document.getElementById(btn);
  const optionsMenu = document.getElementById(options);

  if (!dropdownBtn || !optionsMenu) return;

  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    document.querySelectorAll('.lang-options').forEach(opt => {
      if (opt !== optionsMenu) opt.classList.remove('show');
    });
    document.querySelectorAll('.lang-dropdown-btn').forEach(b => {
      if (b !== dropdownBtn) b.classList.remove('active');
    });

    dropdownBtn.classList.toggle('active');
    optionsMenu.classList.toggle('show');
  });

  optionsMenu.querySelectorAll('.lang-option').forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();

      const lang = option.dataset.lang;
      const flagCode = option.dataset.flag;
      const code = option.dataset.code;

      updateFlagDisplay(dropdownBtn, flagCode, code);

      dropdownBtn.classList.remove('active');
      optionsMenu.classList.remove('show');

      if (typeof changeLanguage === 'function') {
        changeLanguage(lang);
      }

      console.log(`✅ Language changed to: ${lang}`);
    });
  });
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.language-selector')) {
    document.querySelectorAll('.lang-options').forEach(opt => {
      opt.classList.remove('show');
    });
    document.querySelectorAll('.lang-dropdown-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }
});

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    const lang = this.dataset.lang;
    const flagCode = flagMap[lang];
    const code = codeMap[lang];

    langDropdowns.forEach(({ btn: btnId }) => {
      const dropdownBtn = document.getElementById(btnId);
      if (dropdownBtn) {
        updateFlagDisplay(dropdownBtn, flagCode, code);
      }
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('selectedLang') || 'en';
  const flagCode = flagMap[savedLang];
  const code = codeMap[savedLang];

  document.querySelectorAll('.selected-lang').forEach(container => {
    updateFlagDisplay(container, flagCode, code);
  });
});