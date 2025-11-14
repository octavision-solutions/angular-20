<?php
/**
 * Simple PHP Backend API for Multi-Tenant Accounting Application
 * 
 * This is a simplified version that demonstrates the API structure
 * without requiring full CodeIgniter 4 installation.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:4202');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple routing
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove query string and decode URI
$path = parse_url($request_uri, PHP_URL_PATH);
$path = urldecode($path);

// Clean up the path - remove any leading/trailing slashes and normalize
$path = '/' . trim($path, '/');

// Debug logging (can be removed in production)
error_log("API Request: $request_method $path");

// Simple response helper
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

// Debug endpoint
if ($path === '/api.php' && $request_method === 'GET') {
    jsonResponse([
        'debug' => true,
        'message' => 'API Debug Information',
        'request_uri' => $_SERVER['REQUEST_URI'],
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'path' => $path,
        'server_info' => [
            'php_version' => PHP_VERSION,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
        ],
        'available_endpoints' => [
            'POST /api/v1/auth/login' => 'User authentication',
            'GET /api/v1/chart-of-accounts' => 'Chart of accounts (requires auth)',
            'GET /api/v1/users/profile' => 'User profile (requires auth)',
            'GET /api.php' => 'This debug endpoint'
        ]
    ]);
}

// Handle different endpoints
switch ($path) {
    case '/api/v1/auth/login':
        if ($request_method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Demo login - accepts admin@123456 with password admin123
            if (isset($input['username']) && isset($input['password'])) {
                if ($input['username'] === 'admin@123456' && $input['password'] === 'admin123') {
                    jsonResponse([
                        'success' => true,
                        'message' => 'Login successful',
                        'data' => [
                            'access_token' => 'demo_token_' . time(),
                            'refresh_token' => 'demo_refresh_' . time(),
                            'token_type' => 'Bearer',
                            'expires_in' => 3600,
                            'user' => [
                                'id' => 1,
                                'username' => 'admin',
                                'full_name' => 'Administrator',
                                'email' => 'admin@demo.com',
                                'role' => 'admin',
                                'tenant_id' => '123456'
                            ]
                        ]
                    ]);
                } else {
                    jsonResponse([
                        'success' => false,
                        'message' => 'Invalid credentials'
                    ], 401);
                }
            } else {
                jsonResponse([
                    'success' => false,
                    'message' => 'Username and password required'
                ], 400);
            }
        }
        break;
        
    case '/api/v1/auth/register':
        if ($request_method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['company_name']) && isset($input['admin_username'])) {
                $tenant_id = str_pad(mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);
                
                jsonResponse([
                    'success' => true,
                    'message' => 'Registration successful',
                    'data' => [
                        'tenant_id' => $tenant_id,
                        'username_format' => $input['admin_username'] . '@' . $tenant_id,
                        'user_id' => 2
                    ]
                ], 201);
            } else {
                jsonResponse([
                    'success' => false,
                    'message' => 'Company name and admin username required'
                ], 400);
            }
        }
        break;
        
    case '/api/v1/chart-of-accounts':
        if ($request_method === 'GET') {
            // Demo chart of accounts data with 4-level hierarchy
            jsonResponse([
                'success' => true,
                'data' => [
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
                        'has_children' => true
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
                        'has_children' => true
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
                        'has_children' => true
                    ],
                    [
                        'id' => 4,
                        'account_code' => '4000',
                        'account_name' => 'REVENUE',
                        'account_type' => 'revenue',
                        'account_sub_type' => 'main_category',
                        'parent_account_id' => null,
                        'level' => 1,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    [
                        'id' => 5,
                        'account_code' => '5000',
                        'account_name' => 'EXPENSES',
                        'account_type' => 'expense',
                        'account_sub_type' => 'main_category',
                        'parent_account_id' => null,
                        'level' => 1,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    
                    // Level 2 - Sub Categories
                    [
                        'id' => 11,
                        'account_code' => '1100',
                        'account_name' => 'Current Assets',
                        'account_type' => 'asset',
                        'account_sub_type' => 'current',
                        'parent_account_id' => 1,
                        'level' => 2,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    [
                        'id' => 12,
                        'account_code' => '1500',
                        'account_name' => 'Property, Plant & Equipment',
                        'account_type' => 'asset',
                        'account_sub_type' => 'non_current',
                        'parent_account_id' => 1,
                        'level' => 2,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    [
                        'id' => 21,
                        'account_code' => '2100',
                        'account_name' => 'Current Liabilities',
                        'account_type' => 'liability',
                        'account_sub_type' => 'current',
                        'parent_account_id' => 2,
                        'level' => 2,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    [
                        'id' => 31,
                        'account_code' => '3100',
                        'account_name' => 'Share Capital',
                        'account_type' => 'equity',
                        'account_sub_type' => 'capital',
                        'parent_account_id' => 3,
                        'level' => 2,
                        'is_active' => true,
                        'has_children' => false
                    ],
                    [
                        'id' => 41,
                        'account_code' => '4100',
                        'account_name' => 'Sales Revenue',
                        'account_type' => 'revenue',
                        'account_sub_type' => 'operating',
                        'parent_account_id' => 4,
                        'level' => 2,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    [
                        'id' => 51,
                        'account_code' => '5100',
                        'account_name' => 'Cost of Goods Sold',
                        'account_type' => 'expense',
                        'account_sub_type' => 'cost_of_sales',
                        'parent_account_id' => 5,
                        'level' => 2,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    [
                        'id' => 52,
                        'account_code' => '5300',
                        'account_name' => 'Salaries and Wages',
                        'account_type' => 'expense',
                        'account_sub_type' => 'operating',
                        'parent_account_id' => 5,
                        'level' => 2,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    
                    // Level 3 - Detailed Categories
                    [
                        'id' => 111,
                        'account_code' => '1110',
                        'account_name' => 'Cash and Cash Equivalents',
                        'account_type' => 'asset',
                        'account_sub_type' => 'current',
                        'parent_account_id' => 11,
                        'level' => 3,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    [
                        'id' => 112,
                        'account_code' => '1200',
                        'account_name' => 'Accounts Receivable',
                        'account_type' => 'asset',
                        'account_sub_type' => 'current',
                        'parent_account_id' => 11,
                        'level' => 3,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    [
                        'id' => 121,
                        'account_code' => '1520',
                        'account_name' => 'Buildings',
                        'account_type' => 'asset',
                        'account_sub_type' => 'non_current',
                        'parent_account_id' => 12,
                        'level' => 3,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    [
                        'id' => 122,
                        'account_code' => '1530',
                        'account_name' => 'Equipment',
                        'account_type' => 'asset',
                        'account_sub_type' => 'non_current',
                        'parent_account_id' => 12,
                        'level' => 3,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    [
                        'id' => 211,
                        'account_code' => '2200',
                        'account_name' => 'Accounts Payable',
                        'account_type' => 'liability',
                        'account_sub_type' => 'current',
                        'parent_account_id' => 21,
                        'level' => 3,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    [
                        'id' => 411,
                        'account_code' => '4110',
                        'account_name' => 'Product Sales',
                        'account_type' => 'revenue',
                        'account_sub_type' => 'operating',
                        'parent_account_id' => 41,
                        'level' => 3,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    [
                        'id' => 511,
                        'account_code' => '5110',
                        'account_name' => 'Materials Cost',
                        'account_type' => 'expense',
                        'account_sub_type' => 'cost_of_sales',
                        'parent_account_id' => 51,
                        'level' => 3,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    [
                        'id' => 521,
                        'account_code' => '5310',
                        'account_name' => 'Management Salaries',
                        'account_type' => 'expense',
                        'account_sub_type' => 'operating',
                        'parent_account_id' => 52,
                        'level' => 3,
                        'is_active' => true,
                        'has_children' => true
                    ],
                    
                    // Level 4 - Most Detailed Accounts
                    [
                        'id' => 1111,
                        'account_code' => '1111',
                        'account_name' => 'Cash in Hand - Main Office',
                        'account_type' => 'asset',
                        'account_sub_type' => 'current',
                        'parent_account_id' => 111,
                        'level' => 4,
                        'is_active' => true,
                        'has_children' => false
                    ],
                    [
                        'id' => 1112,
                        'account_code' => '1113',
                        'account_name' => 'Bank Account - ABC Bank Checking',
                        'account_type' => 'asset',
                        'account_sub_type' => 'current',
                        'parent_account_id' => 111,
                        'level' => 4,
                        'is_active' => true,
                        'has_children' => false
                    ],
                    [
                        'id' => 1121,
                        'account_code' => '1211',
                        'account_name' => 'Domestic Customers',
                        'account_type' => 'asset',
                        'account_sub_type' => 'current',
                        'parent_account_id' => 112,
                        'level' => 4,
                        'is_active' => true,
                        'has_children' => false
                    ],
                    [
                        'id' => 1211,
                        'account_code' => '1521',
                        'account_name' => 'Main Office Building',
                        'account_type' => 'asset',
                        'account_sub_type' => 'non_current',
                        'parent_account_id' => 121,
                        'level' => 4,
                        'is_active' => true,
                        'has_children' => false
                    ],
                    [
                        'id' => 1221,
                        'account_code' => '1531',
                        'account_name' => 'Manufacturing Equipment',
                        'account_type' => 'asset',
                        'account_sub_type' => 'non_current',
                        'parent_account_id' => 122,
                        'level' => 4,
                        'is_active' => true,
                        'has_children' => false
                    ],
                    [
                        'id' => 2111,
                        'account_code' => '2211',
                        'account_name' => 'Domestic Suppliers',
                        'account_type' => 'liability',
                        'account_sub_type' => 'current',
                        'parent_account_id' => 211,
                        'level' => 4,
                        'is_active' => true,
                        'has_children' => false
                    ],
                    [
                        'id' => 4111,
                        'account_code' => '4111',
                        'account_name' => 'Product Line A Sales',
                        'account_type' => 'revenue',
                        'account_sub_type' => 'operating',
                        'parent_account_id' => 411,
                        'level' => 4,
                        'is_active' => true,
                        'has_children' => false
                    ],
                    [
                        'id' => 5111,
                        'account_code' => '5111',
                        'account_name' => 'Raw Material A',
                        'account_type' => 'expense',
                        'account_sub_type' => 'cost_of_sales',
                        'parent_account_id' => 511,
                        'level' => 4,
                        'is_active' => true,
                        'has_children' => false
                    ],
                    [
                        'id' => 5211,
                        'account_code' => '5311',
                        'account_name' => 'CEO Salary',
                        'account_type' => 'expense',
                        'account_sub_type' => 'operating',
                        'parent_account_id' => 521,
                        'level' => 4,
                        'is_active' => true,
                        'has_children' => false
                    ]
                ],
                'meta' => [
                    'total_accounts' => 30,
                    'levels' => 4,
                    'structure' => [
                        'level_1' => 'Main Categories (1000, 2000, 3000, 4000, 5000)',
                        'level_2' => 'Sub Categories (1100, 1500, 2100, etc.)',
                        'level_3' => 'Detailed Categories (1110, 1200, 1520, etc.)',
                        'level_4' => 'Most Detailed Accounts (1111, 1113, 1211, etc.)'
                    ]
                ]
            ]);
        } elseif ($request_method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['account_code']) && isset($input['account_name'])) {
                jsonResponse([
                    'success' => true,
                    'message' => 'Account created successfully',
                    'data' => [
                        'id' => mt_rand(100, 999),
                        'account_code' => $input['account_code'],
                        'account_name' => $input['account_name'],
                        'account_type' => $input['account_type'] ?? 'asset',
                        'account_sub_type' => $input['account_sub_type'] ?? 'current',
                        'is_active' => true
                    ]
                ], 201);
            } else {
                jsonResponse([
                    'success' => false,
                    'message' => 'Account code and name required'
                ], 400);
            }
        }
        break;
        
    case '/api/v1/status':
        jsonResponse([
            'success' => true,
            'message' => 'API is running',
            'data' => [
                'version' => '1.0.0',
                'environment' => 'development',
                'backend' => 'Simple PHP API (Demo)',
                'note' => 'Install CodeIgniter 4 dependencies for full functionality'
            ]
        ]);
        break;
        
    default:
        jsonResponse([
            'success' => false,
            'message' => 'Endpoint not found',
            'available_endpoints' => [
                'POST /api/v1/auth/login',
                'POST /api/v1/auth/register',
                'GET /api/v1/chart-of-accounts',
                'POST /api/v1/chart-of-accounts',
                'GET /api/v1/status'
            ]
        ], 404);
        break;
}
?>