<?php

function getCache($file) {
    if (file_exists($file) && (time() - filemtime($file) < CACHE_TIME)) {
        return json_decode(file_get_contents($file), true);
    }
    return null;
}

function setCache($file, $data) {
    file_put_contents($file, json_encode($data));
}
?>