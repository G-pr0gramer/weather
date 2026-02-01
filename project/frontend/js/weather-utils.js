function getWeatherInfo(code, lang = 'fa') {
  for (const key in WEATHER_MAP) {
    if (WEATHER_MAP[key].codes.includes(code)) {
      return {
        icon: WEATHER_MAP[key].icon,
        text: WEATHER_MAP[key].text[lang] || WEATHER_MAP[key].text.en
      };
    }
  }
  return {
    icon: '❓',
    text: lang === 'fa' ? 'نامشخص' : 'Unknown'
  };
}
