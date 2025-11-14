<?php
// Test script to verify API functionality
echo "=== API Test Script ===\n";

// Test 1: Database connection
echo "\n1. Testing Database Connection...\n";
try {
    $mysqli = new mysqli('localhost', 'root', '123', 'accounting_app');
    
    if ($mysqli->connect_error) {
        throw new Exception("Connection failed: " . $mysqli->connect_error);
    }
    
    echo "✓ Database connection successful\n";
    
    // Check if tables exist
    $result = $mysqli->query("SHOW TABLES");
    $tables = [];
    while ($row = $result->fetch_array()) {
        $tables[] = $row[0];
    }
    echo "✓ Tables found: " . implode(', ', $tables) . "\n";
    
    // Check users count
    $result = $mysqli->query("SELECT COUNT(*) as count FROM users");
    $row = $result->fetch_assoc();
    $userCount = $row['count'];
    echo "✓ Total users: $userCount\n";
    
} catch (Exception $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 2: User authentication simulation
echo "\n2. Testing User Authentication...\n";
try {
    $stmt = $mysqli->prepare("SELECT * FROM users WHERE username = ? AND tenant_id = ?");
    $stmt->bind_param("ss", $username, $tenant_id);
    $username = 'admin';
    $tenant_id = '123456';
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if ($user) {
        echo "✓ User found: " . $user['full_name'] . " (" . $user['role'] . ")\n";
        echo "✓ Password hash exists: " . (strlen($user['password']) > 0 ? 'Yes' : 'No') . "\n";
        
        // Test password verification
        if (password_verify('admin123', $user['password'])) {
            echo "✓ Password verification: SUCCESS\n";
        } else {
            echo "✗ Password verification: FAILED\n";
        }
    } else {
        echo "✗ User not found\n";
    }
} catch (Exception $e) {
    echo "✗ Authentication test error: " . $e->getMessage() . "\n";
}

// Test 3: Chart of Accounts
echo "\n3. Testing Chart of Accounts...\n";
try {
    $stmt = $mysqli->prepare("SELECT COUNT(*) as count FROM chart_of_accounts WHERE tenant_id = ?");
    $stmt->bind_param("s", $tenant_id);
    $tenant_id = '123456';
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $accountCount = $row['count'];
    echo "✓ Total accounts for tenant 123456: $accountCount\n";
    
    // Get top level accounts
    $stmt = $mysqli->prepare("SELECT account_code, account_name FROM chart_of_accounts WHERE tenant_id = ? AND parent_account_id IS NULL ORDER BY account_code LIMIT 5");
    $stmt->bind_param("s", $tenant_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($account = $result->fetch_assoc()) {
        echo "✓ Top-level account: {$account['account_code']} - {$account['account_name']}\n";
    }
    
} catch (Exception $e) {
    echo "✗ Chart of accounts test error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
?>