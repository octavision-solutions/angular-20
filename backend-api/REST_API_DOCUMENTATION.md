# REST API Documentation

## Base URL
```
http://localhost:8080
```

## API Endpoints

### Authentication

#### Login
- **URL**: `POST /api/v1/auth/login`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "username": "admin@123456",
    "password": "admin123"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "access_token": "demo_token_1761060057",
      "refresh_token": "demo_refresh_1761060057", 
      "token_type": "Bearer",
      "expires_in": 3600,
      "user": {
        "id": 1,
        "username": "admin",
        "full_name": "Administrator",
        "email": "admin@demo.com",
        "role": "admin",
        "tenant_id": "123456"
      }
    }
  }
  ```

### Chart of Accounts

#### Get Chart of Accounts
- **URL**: `GET /api/v1/chart-of-accounts`
- **Authorization**: `Bearer {token}` (Required)
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "account_code": "1000",
        "account_name": "ASSETS",
        "account_type": "asset",
        "account_sub_type": "main_category",
        "parent_account_id": null,
        "level": 1,
        "is_active": true,
        "has_children": true
      }
    ],
    "meta": {
      "total_accounts": 29,
      "levels": 4,
      "structure": {
        "level_1": "Main Categories (1000, 2000, 3000, 4000, 5000)",
        "level_2": "Sub Categories (1100, 1500, 2100, etc.)",
        "level_3": "Detailed Categories (1110, 1200, 1520, etc.)",
        "level_4": "Most Detailed Accounts (1111, 1113, 1211, etc.)"
      }
    }
  }
  ```

### Debug Information

#### API Debug
- **URL**: `GET /api.php`
- **Success Response (200)**:
  ```json
  {
    "debug": true,
    "message": "API Debug Information",
    "available_endpoints": {
      "POST /api/v1/auth/login": "User authentication",
      "GET /api/v1/chart-of-accounts": "Chart of accounts (requires auth)",
      "GET /api/v1/users/profile": "User profile (requires auth)",
      "GET /api.php": "This debug endpoint"
    }
  }
  ```

## Demo Credentials

### System Administrator
- **Username**: `superadmin@000001`
- **Password**: `admin123`
- **Role**: `super_admin`
- **Tenant**: `000001` (System Administration)

### Demo Tenant Users (Tenant: 123456)
- **Admin**: `admin@123456` / `admin123`
- **Accountant**: `accountant@123456` / `account123`
- **Auditor**: `auditor@123456` / `audit123`
- **Viewer**: `viewer@123456` / `view123`

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": ["Username and password are required"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Invalid or expired token."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Endpoint not found"
}
```

## CORS Configuration

The API supports CORS with the following configuration:
- **Allowed Origin**: `http://localhost:4202`
- **Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Allowed Headers**: `Content-Type, Authorization`

## Usage Examples

### cURL Examples

#### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin@123456", "password": "admin123"}'
```

#### Get Chart of Accounts
```bash
curl -X GET http://localhost:8080/api/v1/chart-of-accounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### PowerShell Examples

#### Login
```powershell
$body = @{ username = "admin@123456"; password = "admin123" } | ConvertTo-Json
$response = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json"
$responseData = $response.Content | ConvertFrom-Json
$token = $responseData.data.access_token
```

#### Get Chart of Accounts
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/chart-of-accounts" -Method GET -Headers @{"Authorization" = "Bearer $token"}
$data = $response.Content | ConvertFrom-Json
```

### JavaScript/Angular Examples

#### Login
```typescript
const loginData = {
  username: 'admin@123456',
  password: 'admin123'
};

fetch('http://localhost:8080/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(loginData)
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    localStorage.setItem('token', data.data.access_token);
  }
});
```

#### Get Chart of Accounts
```typescript
const token = localStorage.getItem('token');

fetch('http://localhost:8080/api/v1/chart-of-accounts', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => {
  console.log('Chart of Accounts:', data.data);
});
```

## Development Server

The API runs on PHP's built-in development server with a custom router for proper REST endpoint handling:

```bash
cd backend-api/public
php -S localhost:8080 router.php
```

## Database Configuration

- **Host**: `localhost`
- **Database**: `accounting_app`
- **Username**: `root`
- **Password**: `123`

## Features

- ✅ Multi-tenant architecture with tenant isolation
- ✅ JWT-based authentication
- ✅ Role-based access control (Super Admin, Admin, Accountant, Auditor, Viewer)
- ✅ 4-level chart of accounts hierarchy
- ✅ CORS support for frontend integration
- ✅ Comprehensive seed data for testing
- ✅ REST API design with proper HTTP status codes
- ✅ Input validation and error handling