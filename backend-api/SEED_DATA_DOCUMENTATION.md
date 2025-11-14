# Seed Data Documentation - Multi-Tenant Accounting System

## Overview
This document describes the comprehensive seed data created for the multi-tenant accounting application backend, including demo users and a complete 4-level chart of accounts structure.

## Demo Tenants and Users

### System Tenant (000001)
- **Tenant ID**: 000001
- **Company**: System Administration
- **Subscription**: Enterprise

**System Users:**
| Username | Password | Email | Role | Full Name |
|----------|----------|-------|------|-----------|
| superadmin | admin123 | admin@system.com | super_admin | Super Administrator |

### Demo Tenant (123456)
- **Tenant ID**: 123456
- **Company**: Demo Accounting Company
- **Subscription**: Premium

**Demo Users:**
| Username | Password | Email | Role | Full Name | Login Format |
|----------|----------|-------|------|-----------|-------------|
| admin | admin123 | admin@demo.com | admin | Demo Administrator | admin@123456 |
| accountant | account123 | accountant@demo.com | accountant | Demo Accountant | accountant@123456 |
| auditor | audit123 | auditor@demo.com | auditor | Demo Auditor | auditor@123456 |
| viewer | view123 | viewer@demo.com | viewer | Demo Viewer | viewer@123456 |

## Chart of Accounts Structure (4 Levels)

### Level 1: Main Categories
```
1000 - ASSETS
2000 - LIABILITIES  
3000 - EQUITY
4000 - REVENUE
5000 - EXPENSES
6000 - OTHER INCOME
7000 - OTHER EXPENSES
```

### Level 2: Sub Categories

#### Assets (1000)
- **1100** - Current Assets
- **1200** - Accounts Receivable
- **1300** - Inventory
- **1400** - Prepaid Expenses
- **1500** - Property, Plant & Equipment
- **1600** - Intangible Assets
- **1700** - Investments
- **1800** - Other Assets

#### Liabilities (2000)
- **2100** - Current Liabilities
- **2200** - Accounts Payable
- **2300** - Accrued Expenses
- **2400** - Short-term Loans
- **2500** - Long-term Liabilities
- **2600** - Long-term Loans
- **2700** - Bonds Payable

#### Equity (3000)
- **3100** - Share Capital
- **3200** - Retained Earnings
- **3300** - Capital Reserves
- **3400** - Current Year Earnings

#### Revenue (4000)
- **4100** - Sales Revenue
- **4200** - Service Revenue
- **4300** - Consulting Revenue
- **4400** - Other Operating Revenue

#### Expenses (5000)
- **5100** - Cost of Goods Sold
- **5200** - Cost of Services
- **5300** - Salaries and Wages
- **5400** - Office Expenses
- **5500** - Marketing Expenses
- **5600** - Administrative Expenses
- **5700** - Utilities
- **5800** - Financial Expenses

### Level 3: Detailed Sub-categories

#### Current Assets (1100)
- **1110** - Cash and Cash Equivalents
- **1120** - Short-term Investments
- **1130** - Marketable Securities

#### Accounts Receivable (1200)
- **1210** - Trade Receivables
- **1220** - Other Receivables
- **1230** - Allowance for Doubtful Accounts

#### Inventory (1300)
- **1310** - Raw Materials
- **1320** - Work in Progress
- **1330** - Finished Goods

#### Property, Plant & Equipment (1500)
- **1510** - Land
- **1520** - Buildings
- **1530** - Equipment
- **1540** - Vehicles
- **1550** - Furniture and Fixtures
- **1560** - Accumulated Depreciation

#### Accounts Payable (2200)
- **2210** - Trade Payables
- **2220** - Other Payables

#### Sales Revenue (4100)
- **4110** - Product Sales
- **4120** - Service Sales
- **4130** - Rental Income

#### Cost of Goods Sold (5100)
- **5110** - Materials Cost
- **5120** - Labor Cost
- **5130** - Manufacturing Overhead

#### Salaries and Wages (5300)
- **5310** - Management Salaries
- **5320** - Staff Salaries
- **5330** - Overtime Pay
- **5340** - Bonuses
- **5350** - Employee Benefits

#### Office Expenses (5400)
- **5410** - Office Supplies
- **5420** - Office Rent
- **5430** - Communications
- **5440** - Equipment Rental

### Level 4: Most Detailed Accounts

#### Cash and Cash Equivalents (1110)
- **1111** - Cash in Hand - Main Office
- **1112** - Cash in Hand - Branch Office
- **1113** - Bank Account - ABC Bank Checking
- **1114** - Bank Account - ABC Bank Savings
- **1115** - Bank Account - XYZ Bank Business

#### Trade Receivables (1210)
- **1211** - Domestic Customers
- **1212** - International Customers
- **1213** - Government Contracts
- **1214** - Related Party Receivables

#### Finished Goods (1330)
- **1331** - Product Line A
- **1332** - Product Line B
- **1333** - Product Line C
- **1334** - Discontinued Products

#### Buildings (1520)
- **1521** - Main Office Building
- **1522** - Warehouse Building
- **1523** - Branch Office Building

#### Equipment (1530)
- **1531** - Manufacturing Equipment
- **1532** - Office Equipment
- **1533** - IT Equipment
- **1534** - Testing Equipment

#### Trade Payables (2210)
- **2211** - Domestic Suppliers
- **2212** - International Suppliers
- **2213** - Utility Companies
- **2214** - Service Providers

#### Product Sales (4110)
- **4111** - Product Line A Sales
- **4112** - Product Line B Sales
- **4113** - Product Line C Sales
- **4114** - Clearance Sales

#### Materials Cost (5110)
- **5111** - Raw Material A
- **5112** - Raw Material B
- **5113** - Packaging Materials
- **5114** - Consumable Supplies

#### Management Salaries (5310)
- **5311** - CEO Salary
- **5312** - CFO Salary
- **5313** - Department Head Salaries
- **5314** - Middle Management Salaries

#### Office Supplies (5410)
- **5411** - Stationery
- **5412** - Computer Supplies
- **5413** - Cleaning Supplies
- **5414** - Pantry Supplies

## Account Hierarchy Features

### 4-Level Structure
1. **Level 1**: Main account categories (1000, 2000, 3000, etc.)
2. **Level 2**: Sub-categories (1100, 1200, 1300, etc.)
3. **Level 3**: Detailed categories (1110, 1120, 1210, etc.)
4. **Level 4**: Most detailed accounts (1111, 1112, 1211, etc.)

### Key Features
- **Parent-Child Relationships**: Each account can have a parent account
- **Hierarchy Levels**: Supports up to 4 levels of nesting
- **Account Types**: Asset, Liability, Equity, Revenue, Expense
- **Sub-Types**: Current, Non-Current, Operating, etc.
- **Active Status**: All accounts can be activated/deactivated
- **Descriptions**: Detailed descriptions for each account

### Account Code Structure
- **Level 1**: 1 digit + 000 (e.g., 1000, 2000, 3000)
- **Level 2**: 2 digits + 00 (e.g., 1100, 1200, 2100)
- **Level 3**: 3 digits + 0 (e.g., 1110, 1210, 5310)
- **Level 4**: 4 digits (e.g., 1111, 1211, 5311)

## API Integration

### Chart of Accounts Endpoint
- **URL**: `GET /api/v1/chart-of-accounts`
- **Returns**: Complete hierarchy with level indicators
- **Features**:
  - Parent-child relationships
  - Level identification (1-4)
  - Has children indicator
  - Account type and sub-type
  - Active status

### Sample API Response Structure
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
    "total_accounts": 150,
    "levels": 4,
    "structure": {
      "level_1": "Main Categories",
      "level_2": "Sub Categories", 
      "level_3": "Detailed Categories",
      "level_4": "Most Detailed Accounts"
    }
  }
}
```

## Database Installation

### Setup Command
```sql
mysql -u root -p < database_setup.sql
```

### What Gets Created
1. **Database**: `accounting_app`
2. **Tables**: All necessary tables with relationships
3. **Tenants**: System (000001) and Demo (123456) tenants
4. **Users**: Complete user accounts for testing
5. **Chart of Accounts**: Full 4-level hierarchy (150+ accounts)

## Testing the Seed Data

### Login with Demo Users
```bash
# Test admin login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin@123456", "password": "admin123"}'
```

### View Chart of Accounts
```bash
# Get chart of accounts
curl -X GET http://localhost:8080/api/v1/chart-of-accounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Benefits of This Structure

1. **Comprehensive**: Covers all major accounting areas
2. **Scalable**: Easy to add more accounts at any level
3. **Hierarchical**: Supports detailed financial reporting
4. **Flexible**: Can be customized for different industries
5. **Multi-tenant**: Each tenant gets their own chart structure
6. **Professional**: Based on standard accounting practices

This seed data provides a solid foundation for any accounting application and can be easily extended or modified based on specific business requirements.