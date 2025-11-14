<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use App\Services\JWTService;
use CodeIgniter\Config\Services;

class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $jwtService = new JWTService();
        $response = Services::response();
        
        // Get authorization header
        $authHeader = $request->getHeaderLine('Authorization');
        
        if (!$authHeader) {
            return $response->setStatusCode(401)->setJSON([
                'success' => false,
                'message' => 'Authorization header missing'
            ]);
        }
        
        // Extract token
        $token = $jwtService->extractTokenFromHeader($authHeader);
        
        if (!$token) {
            return $response->setStatusCode(401)->setJSON([
                'success' => false,
                'message' => 'Invalid authorization header format'
            ]);
        }
        
        // Validate token
        $payload = $jwtService->validateToken($token);
        
        if (!$payload) {
            return $response->setStatusCode(401)->setJSON([
                'success' => false,
                'message' => 'Invalid or expired token'
            ]);
        }
        
        // Store user data in request for later use
        $request->user = $payload;
        
        return $request;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // Nothing to do here
    }
}