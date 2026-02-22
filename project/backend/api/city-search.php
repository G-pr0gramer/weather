<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
ob_start();

header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/cache.php';

$q = trim($_GET['q'] ?? '');

if (strlen($q) < 2) {
    echo json_encode([]);
    exit;
}

$apiKey = defined('WEATHER_API_KEY') ? WEATHER_API_KEY : '';

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


$citysearch = "https://api.openweathermap.org/geo/1.0/direct?q=" 
    . urlencode($q) 
    . "&limit=8&appid=" 
    . $apiKey;;
$cityresponse = fetchUrl($citysearch);

if (isset($cityresponse['error'])) {
    echo json_encode([]);
    exit;
}

$cleanResults = [];

foreach ($cityresponse as $item) {
    $cleanResults[] = [
        "name" => $item['name'] ?? '',
        "country" => $item['country'] ?? '',
        "state" => $item['state'] ?? '',
        "lat" => $item['lat'] ?? null,
        "lon" => $item['lon'] ?? null
    ];
}

if (ob_get_length()) ob_clean();

echo json_encode($cleanResults);

