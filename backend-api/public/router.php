<?php
/**
 * Router for PHP built-in development server
 * This file handles routing when using `php -S localhost:8080 router.php`
 */

$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove query string
$path = parse_url($request_uri, PHP_URL_PATH);

// Log the request for debugging
error_log("Router: $request_method $path");

// Route API requests to api.php
if (strpos($path, '/api/') === 0) {
    // Set the original URI for the API to process
    $_SERVER['ORIGINAL_REQUEST_URI'] = $request_uri;
    include 'api.php';
    return true;
}

// Handle static files
if (is_file(__DIR__ . $path)) {
    return false; // Let the built-in server handle static files
}

// Route everything else to index.html (for Angular)
if ($path !== '/index.html' && !is_file(__DIR__ . $path)) {
    include 'index.html';
    return true;
}

// Default behavior
return false;
?>