const METEO_MAP = {
  clear: {
    codes: [0],
    icon: '☀️',
    text: {
      fa: 'صاف',
      en: 'Clear',
      tr: 'Açık'
    }
  },
  partly_cloudy: {
    codes: [1, 2],
    icon: '🌤️',
    text: {
      fa: 'نیمه ابری',
      en: 'Partly Cloudy',
      tr: 'Parçalı Bulutlu'
    }
  },
  cloudy: {
    codes: [3],
    icon: '☁️',
    text: {
      fa: 'ابری',
      en: 'Cloudy',
      tr: 'Bulutlu'
    }
  },
  fog: {
    codes: [45, 48],
    icon: '🌫️',
    text: {
      fa: 'مه آلود',
      en: 'Fog',
      tr: 'Sisli'
    }
  },
  drizzle: {
    codes: [51, 53, 55],
    icon: '🌦️',
    text: {
      fa: 'نم نم باران',
      en: 'Drizzle',
      tr: 'Çiseleme'
    }
  },
  rain: {
    codes: [61, 63, 65, 80, 81, 82],
    icon: '🌧️',
    text: {
      fa: 'بارانی',
      en: 'Rain',
      tr: 'Yağmur'
    }
  },
  snow: {
    codes: [71, 73, 75],
    icon: '❄️',
    text: {
      fa: 'برفی',
      en: 'Snow',
      tr: 'Kar'
    }
  },
  thunderstorm: {
    codes: [95, 96, 99],
    icon: '⛈️',
    text: {
      fa: 'رعد و برق',
      en: 'Thunderstorm',
      tr: 'Fırtına'
    }
  }
};