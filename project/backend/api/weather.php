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
$city = $_GET['city'] ?? null;

if ($lat && $lon) {
    $cacheKey = "weather-" . str_replace('.', '-', $lat) . "-" . str_replace('.', '-', $lon);
} elseif ($city) {
    $cityKey = strtolower(preg_replace('/\s+/', '-', trim($city)));
    $cacheKey = "weather-$cityKey";
} else {
    echo json_encode(["error" => true, "message" => "City or coordinates required"]);
    exit;
}

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




if ($lat && $lon) {

    
    $geoUrl = "https://api.openweathermap.org/geo/1.0/reverse?lat=$lat&lon=$lon&limit=1&appid=$apiKey";
    $geoResponse = fetchUrl($geoUrl);

    $cityName = 'Unknown Location';

    if (isset($geoResponse[0]['name'])) {
        $cityName = $geoResponse[0]['name'];
    }

} else {

    $currentUrl = "https://api.openweathermap.org/data/2.5/weather?q=" . urlencode($city) . "&units=metric&appid=$apiKey";
    $response = fetchUrl($currentUrl);

    if (isset($response['error']) || (isset($response['cod']) && $response['cod'] != 200)) {
        echo json_encode([
            "error" => true,
            "message" => $response['message'] ?? "Current Weather API error"
        ]);
        exit;
    }

    $lat = $response['coord']['lat'];
    $lon = $response['coord']['lon'];
    $cityName = $response['name'];
}

if (isset($response['error'])) {
    echo json_encode([
        "error" => true,
        "message" => "Current Weather API error",
        "httpCode" => $response['httpCode'] ?? null,
        "raw" => $response
    ]);
    exit;
}

if (isset($response['cod']) && $response['cod'] != 200) {
    echo json_encode([
        "error" => true,
        "message" => $response['message'] ?? 'Current Weather API returned error',
        "raw" => $response
    ]);
    exit;
}



$forecastUrl = "https://api.open-meteo.com/v1/forecast?"
    . "latitude=$lat"
    . "&longitude=$lon"
    . "&hourly=temperature_2m,weathercode"
    . "&daily=temperature_2m_max,temperature_2m_min,weathercode"
    . "&current_weather=true"
    . "&timezone=auto";
    if (!$lat || !$lon) {
    echo json_encode([
        "debug" => true,
        "lat" => $lat,
        "lon" => $lon
    ]);
    exit;
}
$meteo = fetchUrl($forecastUrl);



if (isset($meteo['error'])) {
    echo json_encode([
        "error" => true,
        "message" => "Forecast API error",
        "httpCode" => $forecast['httpCode'] ?? null,
        "raw" => $forecast
    ]);
    exit;
}


$airqualityUrl = "https://air-quality-api.open-meteo.com/v1/air-quality?"
    . "latitude=$lat"
    . "&longitude=$lon"
    . "&hourly=us_aqi"
    . "&timezone=auto";

$aq = fetchUrl($airqualityUrl);

function getAqiLevel($aqi) {

    if ($aqi <= 50) return "Good";
    if ($aqi <= 100) return "Moderate";
    if ($aqi <= 150) return "Unhealthy for Sensitive";
    if ($aqi <= 200) return "Unhealthy";
    return "Very Unhealthy";
}
if (isset($aq['error'])) {
    echo json_encode([
        "error" => true,
        "message" => "Air Quality API error",
        "httpCode" => $aq['httpCode'] ?? null,
        "raw" => $aq
    ]);
    exit;
}

$aqiValue = $aq['hourly']['us_aqi'][0] ?? null;

$aqi = [
    "value" => $aqiValue,
    "level" => $aqiValue ? getAqiLevel($aqiValue) : null
];






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

/* ذخیره کش */
setCache($cacheFile, $data);

/* خروجی */
if (ob_get_length()) ob_clean();

echo json_encode($data);
