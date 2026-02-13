function getWeatherInfo(code, lang = 'en') {
  for (const key in METEO_MAP) {
    if (METEO_MAP[key].codes.includes(code)) {
      return {
        icon: METEO_MAP[key].icon,
        text: METEO_MAP[key].text[lang] || METEO_MAP[key].text.en
      };
    }
  }

  return {
    icon: '❓',
    text: lang === 'fa' ? 'نامشخص' : 'Unknown'
  };
}



document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.querySelector('.search-bar input');
    let autocompleteContainer = null;
    let debounceTimer = null;
    

    function createAutocompleteContainer() {
        if (!autocompleteContainer) {
            autocompleteContainer = document.createElement('div');
            autocompleteContainer.className = 'autocomplete-container';
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
            searchInput.parentElement.appendChild(autocompleteContainer);
        }
        return autocompleteContainer;
    }

    function clearAutocomplete() {
        if (autocompleteContainer) {
            autocompleteContainer.innerHTML = '';
            autocompleteContainer.style.display = 'none';
        }
    }

    function showSuggestions(cities) {
        const container = createAutocompleteContainer();
        container.innerHTML = '';

        if (cities.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        cities.forEach(city => {
            const suggestion = document.createElement('div');
            suggestion.className = 'autocomplete-item';
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
                        ${city.state ? city.state + ' • ' : ''}${countryName}
                    </div>
                </div>
            `;

            suggestion.onmouseover = () => {
                suggestion.style.background = 'rgba(45, 68, 91, 0.8)';
            };

            suggestion.onmouseout = () => {
                suggestion.style.background = 'transparent';
            };

            suggestion.onclick = () => {
                searchInput.value = city.name;
                clearAutocomplete();
                loadWeather(city.name)
            };

            container.appendChild(suggestion);
        });
    }

    function getCountryName(code) {
        const countries = {
            'IR': 'Iran',
            'US': 'United States',
            'GB': 'United Kingdom',
            'FR': 'France',
            'DE': 'Germany',
            'IT': 'Italy',
            'ES': 'Spain',
            'CA': 'Canada',
            'AU': 'Australia',
            'JP': 'Japan',
            'CN': 'China',
            'IN': 'India',
            'BR': 'Brazil',
            'RU': 'Russia'
        };
        return countries[code] || code;
    }
    
  
    async function searchCities(query) {
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

            const cities = data.map(item => ({
                name: item.name,
                country: item.country,
                state: item.state || '',
                lat: item.lat,
                lon: item.lon
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

            showSuggestions(sortedCities);

        } catch (error) {
            console.error('Error searching cities:', error);

            const container = createAutocompleteContainer();
            container.innerHTML = `
                <div style="padding: 15px; text-align: center; color: #ff6b6b; font-size: 0.9rem;">
                    <div>⚠️ Unable to search cities</div>
                    <div style="font-size: 0.8rem; margin-top: 5px; opacity: 0.8;">
                        Please check your internet connection
                    </div>
                </div>
            `;
            container.style.display = 'block';
        }
    }

   



 


  

    searchInput.addEventListener('input', function (e) {
        const query = e.target.value.trim();
        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            if (query.length >= 2) {
                searchCities(query);
            } else {
                clearAutocomplete();
            }
        }, 300);
    });

    document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) &&
            !autocompleteContainer?.contains(e.target)) {
            clearAutocomplete();
        }
    });

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const city = searchInput.value.trim();
            if (city) {
                clearAutocomplete();
                searchCities(city);
                
            }
        }
    });

    console.log('City search autocomplete initialized');
});

let currentLang = 'en';

function changeLanguage(lang) {
    currentLang = lang;
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });
    
    if (currentCity) {
        loadWeather(currentCity);
    }
    
    console.log(`Language changed to: ${lang}`);
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const lang = this.dataset.lang;
        changeLanguage(lang);
    });
});

let isSoundEnabled = true;
let currentWeatherSound = null;
let currentWeatherCode = 800;

const weatherSounds = {
    rain: 'sounds/rain.mp3',
    thunderstorm: 'sounds/thunder.mp3',
    wind: 'sounds/wind.mp3',
    snow: 'sounds/snow.mp3',
    clear: 'sounds/ambience.mp3'
};

function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    
    const soundBtn = document.getElementById('sound-toggle');
    
    if (isSoundEnabled) {
        soundBtn.classList.remove('muted');
        soundBtn.innerHTML = '<span class="sound-icon">🔊</span>';
        playWeatherSound(currentWeatherCode);
    } else {
        soundBtn.classList.add('muted');
        soundBtn.innerHTML = '<span class="sound-icon">🔇</span>';
        stopWeatherSound();
    }
}

function playWeatherSound(weatherCode) {
    if (!isSoundEnabled) return;
    
    stopWeatherSound();
    
    let soundType = 'clear';
    
    if ([500, 501, 502, 503, 504, 511, 520, 521, 522, 531].includes(weatherCode)) {
        soundType = 'rain';
    } else if ([200, 201, 202, 210, 211, 212, 221, 230, 231, 232].includes(weatherCode)) {
        soundType = 'thunderstorm';
    } else if ([701, 711, 721, 731, 741, 751, 761, 762, 771, 781].includes(weatherCode)) {
        soundType = 'wind';
    } else if ([600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622].includes(weatherCode)) {
        soundType = 'snow';
    }
    
    const soundUrl = weatherSounds[soundType];
    
    if (soundUrl) {
        currentWeatherSound = new Audio(soundUrl);
        currentWeatherSound.loop = true;
        currentWeatherSound.volume = 0.3;
        currentWeatherSound.play().catch(err => {
            console.log('Sound autoplay blocked:', err);
        });
    }
}

function stopWeatherSound() {
    if (currentWeatherSound) {
        currentWeatherSound.pause();
        currentWeatherSound.currentTime = 0;
        currentWeatherSound = null;
    }
}

document.getElementById('sound-toggle').addEventListener('click', toggleSound);

function updateWeatherCode(code) {
    currentWeatherCode = code;
    if (isSoundEnabled) {
        playWeatherSound(code);
    }
}

let isDarkMode = true;

function toggleTheme() {
    isDarkMode = !isDarkMode;
    
    const themeBtn = document.getElementById('theme-toggle');
    
    if (isDarkMode) {
        document.body.style.backgroundColor = 'rgb(29, 29, 71)';
        document.body.style.color = '#fff';
        themeBtn.innerHTML = '<span class="theme-icon">🌙</span>';
    } else {
        document.body.style.backgroundColor = '#f5f5f5';
        document.body.style.color = '#333';
        themeBtn.innerHTML = '<span class="theme-icon">☀️</span>';
    }
    
    document.querySelectorAll('.weather-card, .day-card, .chart-container').forEach(card => {
        if (isDarkMode) {
            card.style.background = 'rgba(26, 43, 60, 0.7)';
            card.style.color = '#fff';
        } else {
            card.style.background = 'rgba(255, 255, 255, 0.9)';
            card.style.color = '#333';
        }
    });
    
    const header = document.querySelector('.main-header');
    if (header) {
        if (isDarkMode) {
            header.style.background = '#1a2b3c';
            header.style.color = '#fff';
        } else {
            header.style.background = '#fff';
            header.style.color = '#333';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
    }
}

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

console.log('Header features initialized');