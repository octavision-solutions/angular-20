<?php

namespace App\Services;

use App\Config\MySQLiDatabase;

class TenantService
{
    private $mysqliDB;

    public function __construct()
    {
        $this->mysqliDB = new MySQLiDatabase();
    }
    /**
     * Generate a random 6-digit tenant identifier
     */
    public function generateTenantId(): string
    {
        do {
            $tenantId = str_pad((string) mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);
        } while ($this->tenantIdExists($tenantId));

        return $tenantId;
    }

    /**
     * Check if tenant ID already exists
     */
    public function tenantIdExists(string $tenantId): bool
    {
        try {
            $stmt = $this->mysqliDB->prepare('SELECT COUNT(*) as count FROM tenants WHERE tenant_id = ?');
            $stmt->bind_param('s', $tenantId);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();
            
            return $row['count'] > 0;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Extract tenant ID from username@tenantId format
     */
    public function extractTenantFromUsername(string $username): array
    {
        if (strpos($username, '@') === false) {
            return [
                'username' => $username,
                'tenant_id' => null
            ];
        }

        $parts = explode('@', $username, 2);
        return [
            'username' => $parts[0],
            'tenant_id' => $parts[1] ?? null
        ];
    }

    /**
     * Format username with tenant ID
     */
    public function formatUsernameWithTenant(string $username, string $tenantId): string
    {
        return $username . '@' . $tenantId;
    }

    /**
     * Validate tenant ID format (6 digits)
     */
    public function isValidTenantIdFormat(string $tenantId): bool
    {
        return preg_match('/^\d{6}$/', $tenantId) === 1;
    }

    /**
     * Get tenant information by tenant ID
     */
    public function getTenant(string $tenantId): ?array
    {
        try {
            $stmt = $this->mysqliDB->prepare('SELECT * FROM tenants WHERE tenant_id = ? AND status = "active"');
            $stmt->bind_param('s', $tenantId);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();
            
            return $row ?: null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Create new tenant
     */
    public function createTenant(array $tenantData): array
    {
        try {
            $tenantId = $this->generateTenantId();
            
            $stmt = $this->mysqliDB->prepare(
                'INSERT INTO tenants (tenant_id, company_name, subscription_plan, subscription_status, status, created_at, updated_at) VALUES (?, ?, ?, ?, "active", NOW(), NOW())'
            );
            
            $stmt->bind_param(
                'ssss',
                $tenantId,
                $tenantData['company_name'],
                $tenantData['subscription_plan'],
                $tenantData['subscription_status']
            );
            
            $stmt->execute();
            $insertId = $this->mysqliDB->lastInsertId();
            $stmt->close();
            
            return [
                'tenant_id' => $tenantId,
                'id' => $insertId
            ];
        } catch (\Exception $e) {
            throw new \Exception('Failed to create tenant: ' . $e->getMessage());
        }
    }

    /**
     * Get current tenant ID from context/request
     */
    public function getCurrentTenantId(): ?string
    {
        // This would typically be extracted from the authenticated user's token
        $jwtService = new JWTService();
        $user = $jwtService->getCurrentUser();
        
        return $user['tenant_id'] ?? null;
    }

    /**
     * Apply tenant filter to query builder
     */
    public function applyTenantFilter($builder, string $tenantColumn = 'tenant_id'): void
    {
        $tenantId = $this->getCurrentTenantId();
        if ($tenantId) {
            $builder->where($tenantColumn, $tenantId);
        }
    }

    /**
     * Check if user belongs to tenant
     */
    public function userBelongsToTenant(int $userId, string $tenantId): bool
    {
        try {
            $stmt = $this->mysqliDB->prepare('SELECT COUNT(*) as count FROM users WHERE id = ? AND tenant_id = ?');
            $stmt->bind_param('is', $userId, $tenantId);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();
            
            return $row['count'] > 0;
        } catch (\Exception $e) {
            return false;
        }
    }
}