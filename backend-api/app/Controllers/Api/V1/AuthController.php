<?php

namespace App\Controllers\Api\V1;

use CodeIgniter\RESTful\ResourceController;
use App\Services\JWTService;
use App\Services\TenantService;
use App\Config\MySQLiDatabase;

class AuthController extends ResourceController
{
    protected $format = 'json';
    protected $mysqliDB;

    public function login()
    {
        // Initialize MySQLi database connection
        $this->mysqliDB = new MySQLiDatabase();
        
        $rules = [
            'username' => 'required|min_length[3]',
            'password' => 'required|min_length[6]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $username = $this->request->getVar('username');
        $password = $this->request->getVar('password');

        $tenantService = new TenantService();
        $usernameParts = $tenantService->extractTenantFromUsername($username);
        
        if (!$usernameParts['tenant_id']) {
            return $this->fail('Invalid username format. Use username@tenantid');
        }

        // Validate tenant ID format
        if (!$tenantService->isValidTenantIdFormat($usernameParts['tenant_id'])) {
            return $this->fail('Invalid tenant ID format. Must be 6 digits.');
        }

        // Check if tenant exists
        $tenant = $tenantService->getTenant($usernameParts['tenant_id']);
        if (!$tenant) {
            return $this->fail('Tenant not found or inactive');
        }

        // Find user in database using MySQLi
        try {
            $stmt = $this->mysqliDB->prepare(
                'SELECT * FROM users WHERE username = ? AND tenant_id = ? AND status = "active"'
            );
            $stmt->bind_param('ss', $usernameParts['username'], $usernameParts['tenant_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_object();
            $stmt->close();

            if (!$user || !password_verify($password, $user->password)) {
                return $this->fail('Invalid credentials');
            }

            // Generate tokens
            $jwtService = new JWTService();
            $tokenPayload = [
                'user_id' => $user->id,
                'username' => $user->username,
                'tenant_id' => $user->tenant_id,
                'role' => $user->role,
                'full_name' => $user->full_name
            ];

            $accessToken = $jwtService->generateToken($tokenPayload);
            $refreshToken = $jwtService->generateRefreshToken($tokenPayload);

            // Update last login using MySQLi
            $updateStmt = $this->mysqliDB->prepare('UPDATE users SET last_login = NOW() WHERE id = ?');
            $updateStmt->bind_param('i', $user->id);
            $updateStmt->execute();
            $updateStmt->close();

            return $this->respond([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'access_token' => $accessToken,
                    'refresh_token' => $refreshToken,
                    'token_type' => 'Bearer',
                    'expires_in' => 3600,
                    'user' => [
                        'id' => $user->id,
                        'username' => $user->username,
                        'full_name' => $user->full_name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'tenant_id' => $user->tenant_id
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return $this->fail('Database error: ' . $e->getMessage());
        }
    }

    public function register()
    {
        $rules = [
            'company_name' => 'required|min_length[3]',
            'admin_username' => 'required|min_length[3]|alpha_numeric',
            'admin_password' => 'required|min_length[6]',
            'admin_email' => 'required|valid_email',
            'admin_full_name' => 'required|min_length[3]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $db = \Config\Database::connect();
        $tenantService = new TenantService();

        // Check if username already exists
        $existingUser = $db->query(
            'SELECT COUNT(*) as count FROM users WHERE username = ?',
            [$this->request->getVar('admin_username')]
        )->getRow();

        if ($existingUser->count > 0) {
            return $this->fail('Username already exists');
        }

        // Start transaction
        $db->transStart();

        try {
            // Create tenant
            $tenantData = [
                'company_name' => $this->request->getVar('company_name'),
                'subscription_plan' => 'basic',
                'subscription_status' => 'active'
            ];

            $tenant = $tenantService->createTenant($tenantData);

            // Create admin user
            $userData = [
                'username' => $this->request->getVar('admin_username'),
                'password' => password_hash($this->request->getVar('admin_password'), PASSWORD_DEFAULT),
                'email' => $this->request->getVar('admin_email'),
                'full_name' => $this->request->getVar('admin_full_name'),
                'role' => 'admin',
                'tenant_id' => $tenant['tenant_id'],
                'status' => 'active',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $db->table('users')->insert($userData);
            $userId = $db->insertID();

            $db->transComplete();

            if ($db->transStatus() === false) {
                return $this->fail('Registration failed. Please try again.');
            }

            return $this->respondCreated([
                'success' => true,
                'message' => 'Registration successful',
                'data' => [
                    'tenant_id' => $tenant['tenant_id'],
                    'username_format' => $this->request->getVar('admin_username') . '@' . $tenant['tenant_id'],
                    'user_id' => $userId
                ]
            ]);

        } catch (\Exception $e) {
            $db->transRollback();
            return $this->fail('Registration failed: ' . $e->getMessage());
        }
    }

    public function refresh()
    {
        $refreshToken = $this->request->getVar('refresh_token');
        
        if (!$refreshToken) {
            return $this->fail('Refresh token required');
        }

        $jwtService = new JWTService();
        $payload = $jwtService->validateToken($refreshToken);

        if (!$payload || !isset($payload['type']) || $payload['type'] !== 'refresh') {
            return $this->fail('Invalid refresh token');
        }

        // Generate new access token
        unset($payload['type'], $payload['iat'], $payload['exp'], $payload['iss']);
        $newAccessToken = $jwtService->generateToken($payload);

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
        // In a production app, you might want to blacklist the token
        return $this->respond([
            'success' => true,
            'message' => 'Logout successful'
        ]);
    }

    public function me()
    {
        $jwtService = new JWTService();
        $user = $jwtService->getCurrentUser();

        if (!$user) {
            return $this->fail('User not found');
        }

        return $this->respond([
            'success' => true,
            'data' => $user
        ]);
    }
}