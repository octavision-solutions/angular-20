<?php

namespace App\Controllers\Api\V1;

use CodeIgniter\RESTful\ResourceController;

class AuthController extends ResourceController
{
    protected $format = 'json';

    public function login()
    {
        $rules = [
            'username' => 'required|min_length[3]',
            'password' => 'required|min_length[6]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $username = $this->request->getVar('username');
        $password = $this->request->getVar('password');

        // Hardcoded demo users for testing (no database required)
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
            return $this->fail('Invalid username format. Use username@tenantid');
        }

        // Check credentials
        if (!isset($demoUsers[$username]) || $demoUsers[$username]['password'] !== $password) {
            return $this->fail('Invalid credentials');
        }

        $user = $demoUsers[$username]['user'];

        // Generate simple token (for demo purposes)
        $accessToken = 'demo_jwt_' . time() . '_' . $user['id'];
        $refreshToken = 'demo_refresh_' . time() . '_' . $user['id'];

        return $this->respond([
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
        return $this->fail('Registration not available in demo mode');
    }

    public function refresh()
    {
        $refreshToken = $this->request->getVar('refresh_token');
        
        if (!$refreshToken || !str_starts_with($refreshToken, 'demo_refresh_')) {
            return $this->fail('Invalid refresh token');
        }

        // Extract user ID from token
        $parts = explode('_', $refreshToken);
        $userId = end($parts);

        // Generate new access token
        $newAccessToken = 'demo_jwt_' . time() . '_' . $userId;

        return $this->respond([
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
        return $this->respond([
            'success' => true,
            'message' => 'Logout successful'
        ]);
    }

    public function me()
    {
        // Get token from header
        $authHeader = $this->request->getHeaderLine('Authorization');
        $token = str_replace('Bearer ', '', $authHeader);

        if (!$token || !str_starts_with($token, 'demo_jwt_')) {
            return $this->fail('Invalid token');
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

        return $this->respond([
            'success' => true,
            'data' => $user
        ]);
    }
}