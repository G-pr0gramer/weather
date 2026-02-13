function getWeatherInfo(code, lang = 'fa') {
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