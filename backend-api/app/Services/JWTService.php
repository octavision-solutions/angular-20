<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use CodeIgniter\Config\Services;
use Exception;

class JWTService
{
    private string $key;
    private string $algorithm = 'HS256';
    private int $expirationTime = 3600; // 1 hour

    public function __construct()
    {
        $this->key = getenv('JWT_SECRET') ?: 'your-secret-key-change-in-production';
    }

    /**
     * Generate JWT token
     */
    public function generateToken(array $payload): string
    {
        $issuedAt = time();
        $expiration = $issuedAt + $this->expirationTime;

        $tokenPayload = array_merge($payload, [
            'iat' => $issuedAt,
            'exp' => $expiration,
            'iss' => 'accounting-app',
        ]);

        return JWT::encode($tokenPayload, $this->key, $this->algorithm);
    }

    /**
     * Validate and decode JWT token
     */
    public function validateToken(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->key, $this->algorithm));
            return (array) $decoded;
        } catch (Exception $e) {
            // log_message('error', 'JWT validation failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate refresh token
     */
    public function generateRefreshToken(array $payload): string
    {
        $issuedAt = time();
        $expiration = $issuedAt + (7 * 24 * 3600); // 7 days

        $tokenPayload = array_merge($payload, [
            'iat' => $issuedAt,
            'exp' => $expiration,
            'iss' => 'accounting-app',
            'type' => 'refresh'
        ]);

        return JWT::encode($tokenPayload, $this->key, $this->algorithm);
    }

    /**
     * Extract token from authorization header
     */
    public function extractTokenFromHeader(string $authHeader = null): ?string
    {
        if (!$authHeader) {
            return null;
        }

        if (strpos($authHeader, 'Bearer ') === 0) {
            return substr($authHeader, 7);
        }

        return null;
    }

    /**
     * Get current user from token
     */
    public function getCurrentUser(): ?array
    {
        $request = Services::request();
        $authHeader = $request->getHeaderLine('Authorization');
        
        $token = $this->extractTokenFromHeader($authHeader);
        if (!$token) {
            return null;
        }

        $payload = $this->validateToken($token);
        if (!$payload) {
            return null;
        }

        return $payload;
    }
}