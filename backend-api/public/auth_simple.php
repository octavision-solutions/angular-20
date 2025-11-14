<?php

namespace App\Controllers\Api\V1;

use CodeIgniter\RESTful\ResourceController;

class AuthController extends ResourceController
{
    protected $format = 'json';

    public function login()
    {
        // Get request data (simplified for testing)
        $input = json_decode(file_get_contents('php://input'), true);
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';

        // Basic validation
        if (empty($username) || empty($password)) {
            http_response_code(400);
            return json_encode([
                'success' => false,
                'message' => 'Username and password are required'
            ]);
        }

        // Hardcoded demo users for testing
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
            return json_encode([
                'success' => false,
                'message' => 'Invalid username format. Use username@tenantid'
            ]);
        }

        // Check credentials
        if (!isset($demoUsers[$username]) || $demoUsers[$username]['password'] !== $password) {
            http_response_code(401);
            return json_encode([
                'success' => false,
                'message' => 'Invalid credentials'
            ]);
        }

        $user = $demoUsers[$username]['user'];

        // Generate simple token (for demo purposes)
        $accessToken = 'jwt_token_' . time() . '_' . $user['id'];
        $refreshToken = 'refresh_token_' . time() . '_' . $user['id'];

        // Set CORS headers
        header('Access-Control-Allow-Origin: http://localhost:4202');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Content-Type: application/json');

        return json_encode([
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

    public function register()
    {
        header('Access-Control-Allow-Origin: http://localhost:4202');
        header('Content-Type: application/json');
        
        return json_encode([
            'success' => false,
            'message' => 'Registration not available in demo mode'
        ]);
    }

    public function refresh()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        $refreshToken = $input['refresh_token'] ?? '';
        
        if (!$refreshToken || !str_starts_with($refreshToken, 'refresh_token_')) {
            http_response_code(401);
            header('Content-Type: application/json');
            return json_encode([
                'success' => false,
                'message' => 'Invalid refresh token'
            ]);
        }

        // Extract user ID from token
        $parts = explode('_', $refreshToken);
        $userId = end($parts);

        // Generate new access token
        $newAccessToken = 'jwt_token_' . time() . '_' . $userId;

        header('Access-Control-Allow-Origin: http://localhost:4202');
        header('Content-Type: application/json');
        
        return json_encode([
            'success' => true,
            'data' => [
                'access_token' => $newAccessToken,
                'token_type' => 'Bearer',
                'expires_in' => 3600
            ]
        ]);
    }

    public function logout()
    {
        header('Access-Control-Allow-Origin: http://localhost:4202');
        header('Content-Type: application/json');
        
        return json_encode([
            'success' => true,
            'message' => 'Logout successful'
        ]);
    }

    public function me()
    {
        // Get token from header
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);

        if (!$token || !str_starts_with($token, 'jwt_token_')) {
            http_response_code(401);
            header('Content-Type: application/json');
            return json_encode([
                'success' => false,
                'message' => 'Invalid token'
            ]);
        }

        // Extract user ID from token
        $parts = explode('_', $token);
        $userId = end($parts);

        // Return demo user data
        $user = [
            'id' => (int)$userId,
            'username' => $userId == '1' ? 'admin' : 'accountant',
            'full_name' => $userId == '1' ? 'Demo Administrator' : 'Demo Accountant',
            'email' => $userId == '1' ? 'admin@demo.com' : 'accountant@demo.com',
            'role' => $userId == '1' ? 'admin' : 'accountant',
            'tenant_id' => '123456'
        ];

        header('Access-Control-Allow-Origin: http://localhost:4202');
        header('Content-Type: application/json');
        
        return json_encode([
            'success' => true,
            'data' => $user
        ]);
    }
}