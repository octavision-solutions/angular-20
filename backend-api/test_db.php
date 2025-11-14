<?php
// Test database connection
try {
    $mysqli = new mysqli('localhost', 'root', '', 'accounting_app');
    
    if ($mysqli->connect_error) {
        throw new Exception('Connection failed: ' . $mysqli->connect_error);
    }
    
    echo "✓ Database connection successful\n";
    
    // Test if tables exist
    $result = $mysqli->query("SHOW TABLES");
    $tables = [];
    while ($row = $result->fetch_array()) {
        $tables[] = $row[0];
    }
    
    echo "✓ Found " . count($tables) . " tables\n";
    
    if (in_array('users', $tables)) {
        echo "✓ Users table exists\n";
        
        // Check for test user
        $stmt = $mysqli->prepare("SELECT * FROM users WHERE username = ? AND tenant_id = ?");
        $username = 'admin';
        $tenant_id = '123456';
        $stmt->bind_param('ss', $username, $tenant_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        if ($user) {
            echo "✓ Test user found: " . $user['username'] . " (" . $user['full_name'] . ")\n";
            echo "✓ User role: " . $user['role'] . "\n";
            echo "✓ User status: " . $user['status'] . "\n";
            
            // Test password verification
            if (password_verify('password', $user['password'])) {
                echo "✓ Password verification successful\n";
            } else {
                echo "✗ Password verification failed\n";
                echo "  Stored hash: " . substr($user['password'], 0, 30) . "...\n";
            }
        } else {
            echo "✗ Test user not found\n";
            
            // List all users in tenant
            $result = $mysqli->query("SELECT username, full_name FROM users WHERE tenant_id = '123456'");
            echo "Available users in tenant 123456:\n";
            while ($row = $result->fetch_assoc()) {
                echo "  - " . $row['username'] . " (" . $row['full_name'] . ")\n";
            }
        }
    } else {
        echo "✗ Users table not found\n";
        echo "Available tables: " . implode(', ', $tables) . "\n";
    }
    
    $mysqli->close();
    
} catch (Exception $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
}
?>