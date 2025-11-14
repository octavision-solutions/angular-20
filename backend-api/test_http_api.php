<?php
// Simple HTTP API test without database dependencies
echo "=== API HTTP Test Script ===\n";

// Test data for API calls
$loginData = [
    'username' => 'admin@123456',
    'password' => 'admin123'
];

// Function to make HTTP requests
function makeRequest($url, $method = 'GET', $data = null, $headers = []) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            $headers[] = 'Content-Type: application/json';
        }
    }
    
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    return [
        'success' => empty($error),
        'http_code' => $httpCode,
        'response' => $response,
        'error' => $error
    ];
}

// Test 1: Basic server connectivity
echo "\n1. Testing Server Connectivity...\n";
$result = makeRequest('http://localhost:8080');
if ($result['success']) {
    echo "✓ Server is responding (HTTP {$result['http_code']})\n";
} else {
    echo "✗ Server error: {$result['error']}\n";
}

// Test 2: Login API
echo "\n2. Testing Login API...\n";
$result = makeRequest('http://localhost:8080/api.php?endpoint=auth/login', 'POST', $loginData);
if ($result['success']) {
    echo "✓ Login API responded (HTTP {$result['http_code']})\n";
    echo "Response: " . substr($result['response'], 0, 200) . "...\n";
    
    // Try to parse JSON response
    $responseData = json_decode($result['response'], true);
    if ($responseData && isset($responseData['success'])) {
        if ($responseData['success']) {
            echo "✓ Login successful!\n";
            if (isset($responseData['data']['token'])) {
                echo "✓ JWT token received\n";
                $token = $responseData['data']['token'];
                
                // Test 3: Protected endpoint with token
                echo "\n3. Testing Protected Endpoint...\n";
                $result = makeRequest('http://localhost:8080/api.php?endpoint=chart-of-accounts', 'GET', null, [
                    'Authorization: Bearer ' . $token
                ]);
                
                if ($result['success']) {
                    echo "✓ Chart of accounts API responded (HTTP {$result['http_code']})\n";
                    $chartData = json_decode($result['response'], true);
                    if ($chartData && isset($chartData['success']) && $chartData['success']) {
                        echo "✓ Chart of accounts data retrieved successfully\n";
                        if (isset($chartData['data']) && is_array($chartData['data'])) {
                            echo "✓ Number of accounts: " . count($chartData['data']) . "\n";
                        }
                    }
                } else {
                    echo "✗ Chart of accounts API error: {$result['error']}\n";
                }
            }
        } else {
            echo "✗ Login failed: " . ($responseData['message'] ?? 'Unknown error') . "\n";
        }
    }
} else {
    echo "✗ Login API error: {$result['error']}\n";
}

echo "\n=== HTTP Test Complete ===\n";
?>