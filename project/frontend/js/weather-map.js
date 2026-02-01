const WEATHER_MAP = {
  thunderstorm: {
    codes: [200,201,202,210,211,212,221,230,231,232],
    icon: '⛈️',
    text: {
     
      en: 'Thunderstorm',
      tr: 'Fırtına'
    }
  },
  drizzle: {
    codes: [300,301,302,310,311,312,313,314,321],
    icon: '🌦️',
    text: {
     
      en: 'Drizzle',
      tr: 'Çisenti'
    }
  },
  rain: {
    codes: [500,501,502,503,504,511,520,521,522,531],
    icon: '🌧️',
    text: {
     
      en: 'Rain',
      tr: 'Yağmur'
    }
  },
  snow: {
    codes: [600,601,602,611,612,613,615,616,620,621,622],
    icon: '❄️',
    text: {
      
      en: 'Snow',
      tr: 'Kar'
    }
  },
  clear: {
    codes: [800],
    icon: '☀️',
    text: {
      
      en: 'Clear',
      tr: 'Açık'
    }
  },
  clouds: {
    codes: [801,802,803,804],
    icon: '☁️',
    text: {
      
      en: 'Cloudy',
      tr: 'Bulutlu'
    }
  }
};
