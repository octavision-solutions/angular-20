<?php
// Simple standalone authentication API for testing MySQLi

// Enable CORS
header('Access-Control-Allow-Origin: http://localhost:4202');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request path
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Route the request
if ($path === '/api/v1/auth/login' && $method === 'POST') {
    handleLogin();
} elseif ($path === '/api/v1/auth/me' && $method === 'GET') {
    handleMe();
} elseif ($path === '/api/v1/auth/refresh' && $method === 'POST') {
    handleRefresh();
} elseif ($path === '/api/v1/auth/logout' && $method === 'POST') {
    handleLogout();
} elseif ($path === '/api/v1/chart-of-accounts' && $method === 'GET') {
    handleChartOfAccounts();
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
}

function handleLogin()
{
    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    // Basic validation
    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Username and password are required'
        ]);
        return;
    }

    // Demo users for testing
    $demoUsers = [
        'admin@123456' => [
            'password' => 'password',
            'user' => [
                'id' => 1,
                'username' => 'admin',
                'full_name' => 'Demo Administrator',
                'email' => 'admin@demo.com',
                'role' => 'admin',
                'tenant_id' => '123456'
            ]
        ],
        'accountant@123456' => [
            'password' => 'password',
            'user' => [
                'id' => 2,
                'username' => 'accountant',
                'full_name' => 'Demo Accountant',
                'email' => 'accountant@demo.com',
                'role' => 'accountant',
                'tenant_id' => '123456'
            ]
        ]
    ];

    // Validate username format
    if (!str_contains($username, '@')) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username format. Use username@tenantid'
        ]);
        return;
    }

    // Check credentials
    if (!isset($demoUsers[$username]) || $demoUsers[$username]['password'] !== $password) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid credentials'
        ]);
        return;
    }

    $user = $demoUsers[$username]['user'];

    // Generate JWT-like token
    $accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.' . base64_encode(json_encode([
        'user_id' => $user['id'],
        'username' => $user['username'],
        'tenant_id' => $user['tenant_id'],
        'role' => $user['role'],
        'exp' => time() + 3600
    ])) . '.signature';

    $refreshToken = 'refresh_' . time() . '_' . $user['id'];

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'data' => [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => 3600,
            'user' => $user
        ]
    ]);
}

function handleMe()
{
    // Get token from header
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    $token = str_replace('Bearer ', '', $authHeader);

    if (!$token || !str_starts_with($token, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.')) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid token'
        ]);
        return;
    }

    // Decode token payload
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid token format']);
        return;
    }

    $payload = json_decode(base64_decode($parts[1]), true);
    
    if (!$payload || $payload['exp'] < time()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token expired']);
        return;
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'id' => $payload['user_id'],
            'username' => $payload['username'],
            'tenant_id' => $payload['tenant_id'],
            'role' => $payload['role']
        ]
    ]);
}

function handleRefresh()
{
    $input = json_decode(file_get_contents('php://input'), true);
    $refreshToken = $input['refresh_token'] ?? '';
    
    if (!$refreshToken || !str_starts_with($refreshToken, 'refresh_')) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid refresh token'
        ]);
        return;
    }

    // Extract user ID from token
    $parts = explode('_', $refreshToken);
    $userId = end($parts);

    // Generate new access token
    $newAccessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.' . base64_encode(json_encode([
        'user_id' => (int)$userId,
        'username' => $userId == '1' ? 'admin' : 'accountant',
        'tenant_id' => '123456',
        'role' => $userId == '1' ? 'admin' : 'accountant',
        'exp' => time() + 3600
    ])) . '.signature';

    echo json_encode([
        'success' => true,
        'data' => [
            'access_token' => $newAccessToken,
            'token_type' => 'Bearer',
            'expires_in' => 3600
        ]
    ]);
}

function handleLogout()
{
    echo json_encode([
        'success' => true,
        'message' => 'Logout successful'
    ]);
}

function handleChartOfAccounts()
{
    // Get token from header
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    $token = str_replace('Bearer ', '', $authHeader);

    if (!$token || !str_starts_with($token, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.')) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Access denied. Invalid or expired token.'
        ]);
        return;
    }

    // Decode token payload
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid token format']);
        return;
    }

    $payload = json_decode(base64_decode($parts[1]), true);
    
    if (!$payload || $payload['exp'] < time()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token expired']);
        return;
    }

    // Demo Chart of Accounts data (4-level hierarchy)
    $chartOfAccounts = [
        // Level 1 - Main Categories
        [
            'id' => 1,
            'account_code' => '1000',
            'account_name' => 'ASSETS',
            'account_type' => 'asset',
            'account_sub_type' => 'main_category',
            'parent_account_id' => null,
            'level' => 1,
            'is_active' => true,
            'has_children' => true,
            'tenant_id' => $payload['tenant_id']
        ],
        [
            'id' => 2,
            'account_code' => '2000',
            'account_name' => 'LIABILITIES',
            'account_type' => 'liability',
            'account_sub_type' => 'main_category',
            'parent_account_id' => null,
            'level' => 1,
            'is_active' => true,
            'has_children' => true,
            'tenant_id' => $payload['tenant_id']
        ],
        [
            'id' => 3,
            'account_code' => '3000',
            'account_name' => 'EQUITY',
            'account_type' => 'equity',
            'account_sub_type' => 'main_category',
            'parent_account_id' => null,
            'level' => 1,
            'is_active' => true,
            'has_children' => true,
            'tenant_id' => $payload['tenant_id']
        ],
        // Level 2 - Sub Categories
        [
            'id' => 4,
            'account_code' => '1100',
            'account_name' => 'Current Assets',
            'account_type' => 'asset',
            'account_sub_type' => 'current_asset',
            'parent_account_id' => 1,
            'level' => 2,
            'is_active' => true,
            'has_children' => true,
            'tenant_id' => $payload['tenant_id']
        ],
        [
            'id' => 5,
            'account_code' => '1500',
            'account_name' => 'Fixed Assets',
            'account_type' => 'asset',
            'account_sub_type' => 'fixed_asset',
            'parent_account_id' => 1,
            'level' => 2,
            'is_active' => true,
            'has_children' => true,
            'tenant_id' => $payload['tenant_id']
        ],
        // Level 3 - Detailed Categories
        [
            'id' => 6,
            'account_code' => '1110',
            'account_name' => 'Cash and Cash Equivalents',
            'account_type' => 'asset',
            'account_sub_type' => 'cash',
            'parent_account_id' => 4,
            'level' => 3,
            'is_active' => true,
            'has_children' => true,
            'tenant_id' => $payload['tenant_id']
        ],
        [
            'id' => 7,
            'account_code' => '1200',
            'account_name' => 'Accounts Receivable',
            'account_type' => 'asset',
            'account_sub_type' => 'receivable',
            'parent_account_id' => 4,
            'level' => 3,
            'is_active' => true,
            'has_children' => true,
            'tenant_id' => $payload['tenant_id']
        ],
        // Level 4 - Most Detailed Accounts
        [
            'id' => 8,
            'account_code' => '1111',
            'account_name' => 'Petty Cash',
            'account_type' => 'asset',
            'account_sub_type' => 'cash',
            'parent_account_id' => 6,
            'level' => 4,
            'is_active' => true,
            'has_children' => false,
            'tenant_id' => $payload['tenant_id']
        ],
        [
            'id' => 9,
            'account_code' => '1112',
            'account_name' => 'Bank Account - Checking',
            'account_type' => 'asset',
            'account_sub_type' => 'cash',
            'parent_account_id' => 6,
            'level' => 4,
            'is_active' => true,
            'has_children' => false,
            'tenant_id' => $payload['tenant_id']
        ],
        [
            'id' => 10,
            'account_code' => '1113',
            'account_name' => 'Bank Account - Savings',
            'account_type' => 'asset',
            'account_sub_type' => 'cash',
            'parent_account_id' => 6,
            'level' => 4,
            'is_active' => true,
            'has_children' => false,
            'tenant_id' => $payload['tenant_id']
        ]
    ];

    echo json_encode([
        'success' => true,
        'data' => $chartOfAccounts,
        'meta' => [
            'total_accounts' => count($chartOfAccounts),
            'levels' => 4,
            'structure' => [
                'level_1' => 'Main Categories (1000, 2000, 3000, 4000, 5000)',
                'level_2' => 'Sub Categories (1100, 1500, 2100, etc.)',
                'level_3' => 'Detailed Categories (1110, 1200, 1520, etc.)',
                'level_4' => 'Most Detailed Accounts (1111, 1113, 1211, etc.)'
            ]
        ]
    ]);
}
?>