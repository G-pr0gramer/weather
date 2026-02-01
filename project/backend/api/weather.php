<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
ob_start();

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/cache.php';

$apiKey = defined('WEATHER_API_KEY') ? WEATHER_API_KEY : '';
$city = $_GET['city'] ?? 'istanbul';
$cityKey = strtolower(preg_replace('/\s+/', '-', trim($city)));
$cacheFile = __DIR__ . "/../cache/weather-$cityKey.json";

/* 1️⃣ کش */
if ($cached = getCache($cacheFile)) {
    if (ob_get_length()) ob_clean();
    echo json_encode($cached);
    exit;
}

/* 2️⃣ تابع fetchUrl با cURL */
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

/* 3️⃣ Current Weather */
$currentUrl = "https://api.openweathermap.org/data/2.5/weather?q=" . urlencode($city) . "&units=metric&appid=$apiKey";
$response = fetchUrl($currentUrl);

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

$lat = $response['coord']['lat'];
$lon = $response['coord']['lon'];

/* 4️⃣ 5-day Forecast */
$forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?q=" . urlencode($city) . "&units=metric&appid=$apiKey";
$forecast = fetchUrl($forecastUrl);

if (isset($forecast['error'])) {
    echo json_encode([
        "error" => true,
        "message" => "Forecast API error",
        "httpCode" => $forecast['httpCode'] ?? null,
        "raw" => $forecast
    ]);
    exit;
}

if (isset($forecast['cod']) && $forecast['cod'] != "200") {
    echo json_encode([
        "error" => true,
        "message" => $forecast['message'] ?? 'Forecast API returned error',
        "raw" => $forecast
    ]);
    exit;
}

/* 5️⃣ Hourly - اولین 12 مورد (هر 3 ساعت) */
$hourly = [];
foreach (array_slice($forecast['list'], 0, 12) as $h) {
    $hourly[] = [
        "temp" => round($h['main']['temp']),
        "weather_code" => $h['weather'][0]['id'],
        "time" => date('H:i', $h['dt'])
    ];
}

/* 6️⃣ Daily - میانگین دمای هر روز */
$dailyData = [];
foreach ($forecast['list'] as $item) {
    $day = date('Y-m-d', $item['dt']);
    if (!isset($dailyData[$day])) {
        $dailyData[$day] = ['temps' => [], 'weather_code' => $item['weather'][0]['id']];
    }
    $dailyData[$day]['temps'][] = $item['main']['temp'];
}

$daily = [];
foreach ($dailyData as $day => $data) {
    $daily[] = [
        "temp" => round(array_sum($data['temps']) / count($data['temps'])),
        "weather_code" => $data['weather_code'],
        "name" => date('D', strtotime($day))
    ];
    if (count($daily) >= 5) break; // فقط 5 روز
}

/* 7️⃣ خروجی نهایی */
$data = [
    "city" => $response['name'],
    "current" => [
        "temp" => round($response['main']['temp']),
        "weather_code" => $response['weather'][0]['id'],
        "humidity" => $response['main']['humidity'],
        "wind" => $response['wind']['speed'],
        "lat" => $lat,
        "lon" => $lon
    ],
    "hourly" => $hourly,
    "daily" => $daily,
    "updated_at" => time()
];

/* 8️⃣ ذخیره کش */
setCache($cacheFile, $data);

/* 9️⃣ خروجی */
if (ob_get_length()) ob_clean();
echo json_encode($data);