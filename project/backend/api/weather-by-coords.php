<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
ob_start();

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/cache.php';

$apiKey = defined('WEATHER_API_KEY') ? WEATHER_API_KEY : '';
$lat = $_GET['lat'] ?? null;
$lon = $_GET['lon'] ?? null;

if (!$lat || !$lon) {
    echo json_encode(["error" => true, "message" => "Coordinates required"]);
    exit;
}

$cacheKey = "weather-" . str_replace('.', '-', $lat) . "-" . str_replace('.', '-', $lon);
$cacheFile = __DIR__ . "/../cache/$cacheKey.json";

if ($cached = getCache($cacheFile)) {
    if (ob_get_length()) ob_clean();
    echo json_encode($cached);
    exit;
}

function fetchUrl($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $raw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!$raw) {
        return ['error' => true, 'httpCode' => $httpCode];
    }

    $json = json_decode($raw, true);
    if (!$json) {
        return ['error' => true, 'httpCode' => $httpCode, 'raw' => $raw];
    }

    return $json;
}

// Reverse Geocoding
$geoUrl = "https://api.openweathermap.org/geo/1.0/reverse?lat=$lat&lon=$lon&limit=1&appid=$apiKey";
$geoResponse = fetchUrl($geoUrl);

$cityName = 'Unknown Location';
$countryCode = '';

if (isset($geoResponse[0]['name'])) {
    $cityName = $geoResponse[0]['name'];
    $countryCode = $geoResponse[0]['country'] ?? '';
}

// دریافت آب‌وهوا
$forecastUrl = "https://api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lon&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=auto";
$meteo = fetchUrl($forecastUrl);

if (isset($meteo['error'])) {
    echo json_encode(["error" => true, "message" => "Forecast API error"]);
    exit;
}

// کیفیت هوا
$airqualityUrl = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=$lat&longitude=$lon&hourly=us_aqi&timezone=auto";
$aq = fetchUrl($airqualityUrl);

function getAqiLevel($aqi) {
    if ($aqi <= 50) return "Good";
    if ($aqi <= 100) return "Moderate";
    if ($aqi <= 150) return "Unhealthy for Sensitive";
    if ($aqi <= 200) return "Unhealthy";
    return "Very Unhealthy";
}

$aqiValue = $aq['hourly']['us_aqi'][0] ?? null;
$aqi = ["value" => $aqiValue, "level" => $aqiValue ? getAqiLevel($aqiValue) : null];

$hourly = [];
for ($i = 0; $i < 12; $i++) {
    $hourly[] = [
        "time" => date('H:i', strtotime($meteo['hourly']['time'][$i])),
        "temp" => round($meteo['hourly']['temperature_2m'][$i]),
        "weather_code" => $meteo['hourly']['weathercode'][$i]
    ];
}

$daily = [];
for ($i = 0; $i < 5; $i++) {
    $daily[] = [
        "name" => date('D', strtotime($meteo['daily']['time'][$i])),
        "temp" => round($meteo['daily']['temperature_2m_max'][$i]),
        "weather_code" => $meteo['daily']['weathercode'][$i]
    ];
}

$data = [
    "city" => $cityName,
    "location" => ["name" => $cityName, "country" => $countryCode],
    "current" => [
        "temp" => round($meteo['current_weather']['temperature']),
        "weather_code" => $meteo['current_weather']['weathercode'],
        "wind" => $meteo['current_weather']['windspeed'],
        "humidity" => 50,
        "lat" => $lat,
        "lon" => $lon,
        "aqi" => $aqi
    ],
    "hourly" => $hourly,
    "daily" => $daily,
    "updated_at" => time()
];

setCache($cacheFile, $data);

if (ob_get_length()) ob_clean();
echo json_encode($data);