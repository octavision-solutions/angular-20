# Multi-Tenant Accounting Application Backend

## Overview
This is a PHP CodeIgniter 4 backend API for a multi-tenant accounting application. It provides JWT-based authentication with tenant isolation at the row level.

## Features
- **Multi-Tenant Architecture**: Each tenant is identified by a unique 6-digit number
- **User Authentication**: Username format is `username@tenantid` (e.g., `admin@598501`)
- **Role-Based Access Control**: Super Admin, Admin, Accountant, Auditor, Viewer
- **JWT Authentication**: Secure token-based authentication
- **RESTful API**: Clean API endpoints for all accounting operations
- **Row-Level Security**: All data is isolated by tenant ID

## Tenant & User System

### Tenant Registration
- Company registration creates a new tenant with a random 6-digit ID
- First user becomes the admin for that tenant
- Subscription management (basic, premium, enterprise)

### User Authentication Format
```
username@tenantid
Examples:
- admin@598501
- accountant@123456
- auditor@999888
```

### Roles and Permissions
- **Super Admin**: System-wide access (tenant 000001)
- **Admin**: Full access within tenant
- **Accountant**: Can create and modify financial entries
- **Auditor**: Read-only access to all financial data
- **Viewer**: Limited read access

## Installation

### Requirements
- PHP 8.1 or higher
- MySQL 8.0 or higher
- Composer
- Web server (Apache/Nginx)

### Setup Steps

1. **Install Dependencies**
   ```bash
   cd backend-api
   composer install
   ```

2. **Database Setup**
   ```bash
   # Create database and import schema
   mysql -u root -p < database_setup.sql
   ```

3. **Environment Configuration**
   ```bash
   # Copy and configure environment file
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Configure Web Server**
   - Point document root to `backend-api/public`
   - Enable URL rewriting
   - Ensure proper permissions

### Environment Variables
```env
# Database
database.default.hostname = localhost
database.default.database = accounting_app
database.default.username = your_username
database.default.password = your_password

# JWT Security
JWT_SECRET = "your-super-secret-jwt-key-change-in-production"

# Application
app.baseURL = 'http://localhost:8080/'
CI_ENVIRONMENT = development
```

## API Endpoints

### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Tenants
```
POST /api/v1/tenants/register
GET  /api/v1/tenants/{tenant_id}
PUT  /api/v1/tenants/{tenant_id}
```

### Chart of Accounts
```
GET    /api/v1/chart-of-accounts
POST   /api/v1/chart-of-accounts
GET    /api/v1/chart-of-accounts/{id}
PUT    /api/v1/chart-of-accounts/{id}
DELETE /api/v1/chart-of-accounts/{id}
```

### Journal Vouchers
```
GET    /api/v1/journal-vouchers
POST   /api/v1/journal-vouchers
GET    /api/v1/journal-vouchers/{id}
PUT    /api/v1/journal-vouchers/{id}
DELETE /api/v1/journal-vouchers/{id}
```

### Financial Reports
```
GET /api/v1/reports/trial-balance
GET /api/v1/reports/income-statement
GET /api/v1/reports/balance-sheet
GET /api/v1/reports/cash-flow
```

## Usage Examples

### 1. Register New Tenant
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "ABC Company",
    "admin_username": "admin",
    "admin_password": "admin123",
    "admin_email": "admin@abc.com",
    "admin_full_name": "Administrator"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "tenant_id": "598501",
    "username_format": "admin@598501",
    "user_id": 2
  }
}
```

### 2. Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@598501",
    "password": "admin123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": 2,
      "username": "admin",
      "full_name": "Administrator",
      "email": "admin@abc.com",
      "role": "admin",
      "tenant_id": "598501"
    }
  }
}
```

### 3. Create Chart of Account
```bash
curl -X POST http://localhost:8080/api/v1/chart-of-accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "account_code": "1130",
    "account_name": "Petty Cash",
    "account_type": "asset",
    "account_sub_type": "current",
    "description": "Small cash fund for minor expenses"
  }'
```

## Database Schema

### Key Tables
- **tenants**: Tenant information and subscription details
- **users**: User accounts with tenant association
- **chart_of_accounts**: Chart of accounts per tenant
- **journal_vouchers**: Journal voucher headers
- **journal_voucher_entries**: Individual journal entries
- **general_ledger**: Transaction history and running balances

### Multi-Tenant Security
All tables include `tenant_id` column for row-level isolation:
```sql
SELECT * FROM chart_of_accounts WHERE tenant_id = '598501';
```

## Default Accounts

The system comes with pre-configured chart of accounts:
- **1000-1999**: Assets (Cash, Receivables, Fixed Assets)
- **2000-2999**: Liabilities (Payables, Loans)
- **3000-3999**: Equity (Capital, Retained Earnings)
- **4000-4999**: Revenue (Sales, Service Income)
- **5000-5999**: Expenses (COGS, Operating Expenses)

## Development

### Project Structure
```
backend-api/
├── app/
│   ├── Controllers/Api/V1/    # API Controllers
│   ├── Services/              # Business Logic
│   ├── Filters/               # Authentication Filters
│   └── Config/                # Configuration Files
├── public/                    # Web Root
├── vendor/                    # Dependencies
└── database_setup.sql         # Database Schema
```

### Adding New Features
1. Create controller in `app/Controllers/Api/V1/`
2. Add routes in `app/Config/Routes.php`
3. Implement business logic in `app/Services/`
4. Apply tenant filtering for data isolation

## Security Considerations

- Always validate tenant ID in requests
- Use prepared statements for database queries
- Implement rate limiting for API endpoints
- Regularly rotate JWT secrets
- Enable HTTPS in production
- Validate user permissions for each operation

## Production Deployment

1. Set `CI_ENVIRONMENT = production` in `.env`
2. Generate strong JWT secret
3. Configure proper database credentials
4. Enable HTTPS and security headers
5. Set up proper logging and monitoring
6. Configure automated backups

## Support

For issues and questions:
1. Check the CodeIgniter 4 documentation
2. Review the API endpoint documentation
3. Check database schema for relationship understanding
4. Ensure proper environment configuration