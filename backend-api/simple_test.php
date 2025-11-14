<?php
// Simple test for current REST API endpoints

echo "=== Testing REST API Endpoints ===\n\n";

// Function to make HTTP requests
function testAPI($url, $method = 'GET', $data = null) {
    $context = stream_context_create([
        'http' => [
            'method' => $method,
            'header' => [
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            'content' => $data ? json_encode($data) : null,
            'timeout' => 10
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    $httpCode = 200;
    
    if ($response === false) {
        $error = error_get_last();
        return [
            'success' => false,
            'error' => $error['message'] ?? 'Unknown error'
        ];
    }
    
    return [
        'success' => true,
        'response' => $response,
        'data' => json_decode($response, true)
    ];
}

// Test 1: Login API
echo "1. Testing Login API...\n";
$loginData = [
    'username' => 'admin@123456',
    'password' => 'password'
];

$result = testAPI('http://localhost:8080/api/v1/auth/login', 'POST', $loginData);

if ($result['success']) {
    echo "✓ Login API responded\n";
    echo "Response: " . $result['response'] . "\n\n";
    
    if ($result['data'] && $result['data']['success']) {
        echo "✓ Login successful!\n";
        $token = $result['data']['data']['access_token'];
        echo "✓ Token: " . substr($token, 0, 50) . "...\n\n";
        
        // Test 2: Chart of Accounts API
        echo "2. Testing Chart of Accounts API...\n";
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $token
                ]
            ]
        ]);
        
        $chartResponse = @file_get_contents('http://localhost:8080/api/v1/chart-of-accounts', false, $context);
        if ($chartResponse) {
            echo "✓ Chart of accounts API responded\n";
            echo "Response: " . substr($chartResponse, 0, 200) . "...\n";
        } else {
            echo "✗ Chart of accounts API failed\n";
        }
    } else {
        echo "✗ Login failed: " . ($result['data']['message'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "✗ Login API error: " . $result['error'] . "\n";
}

echo "\n=== Test Complete ===\n";
?>