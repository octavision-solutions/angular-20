CREATE DATABASE IF NOT EXISTS accounting_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE accounting_app;

-- Tenants table
CREATE TABLE tenants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(6) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    subscription_plan ENUM('basic', 'premium', 'enterprise') DEFAULT 'basic',
    subscription_status ENUM('active', 'suspended', 'cancelled') DEFAULT 'active',
    subscription_expires_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (subscription_status)
);

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(6) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'accountant', 'auditor', 'viewer') NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    UNIQUE KEY unique_username_tenant (username, tenant_id),
    INDEX idx_tenant_user (tenant_id, username),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

-- Chart of Accounts table
CREATE TABLE chart_of_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(6) NOT NULL,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
    account_sub_type VARCHAR(50) NULL,
    parent_account_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts(id),
    UNIQUE KEY unique_account_code_tenant (account_code, tenant_id),
    INDEX idx_tenant_account (tenant_id, account_code),
    INDEX idx_account_type (account_type),
    INDEX idx_parent (parent_account_id)
);

-- Journal Vouchers table
CREATE TABLE journal_vouchers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(6) NOT NULL,
    voucher_number VARCHAR(50) NOT NULL,
    voucher_date DATE NOT NULL,
    reference_number VARCHAR(100) NULL,
    description TEXT NOT NULL,
    total_debit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_credit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status ENUM('draft', 'posted', 'cancelled') DEFAULT 'draft',
    created_by INT NOT NULL,
    posted_by INT NULL,
    posted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (posted_by) REFERENCES users(id),
    UNIQUE KEY unique_voucher_tenant (voucher_number, tenant_id),
    INDEX idx_tenant_voucher (tenant_id, voucher_number),
    INDEX idx_voucher_date (voucher_date),
    INDEX idx_status (status)
);

-- Journal Voucher Entries table
CREATE TABLE journal_voucher_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(6) NOT NULL,
    voucher_id INT NOT NULL,
    account_id INT NOT NULL,
    description TEXT NOT NULL,
    debit_amount DECIMAL(15,2) DEFAULT 0.00,
    credit_amount DECIMAL(15,2) DEFAULT 0.00,
    entry_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (voucher_id) REFERENCES journal_vouchers(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    INDEX idx_tenant_voucher (tenant_id, voucher_id),
    INDEX idx_account (account_id),
    INDEX idx_entry_order (entry_order)
);

-- General Ledger table (for maintaining running balances)
CREATE TABLE general_ledger (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(6) NOT NULL,
    account_id INT NOT NULL,
    voucher_id INT NOT NULL,
    voucher_entry_id INT NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    debit_amount DECIMAL(15,2) DEFAULT 0.00,
    credit_amount DECIMAL(15,2) DEFAULT 0.00,
    running_balance DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (voucher_id) REFERENCES journal_vouchers(id),
    FOREIGN KEY (voucher_entry_id) REFERENCES journal_voucher_entries(id),
    INDEX idx_tenant_account_date (tenant_id, account_id, transaction_date),
    INDEX idx_voucher (voucher_id),
    INDEX idx_transaction_date (transaction_date)
);

-- Insert default super admin (password: admin123)
INSERT INTO tenants (tenant_id, company_name, subscription_plan, subscription_status) 
VALUES ('000001', 'System Administration', 'enterprise', 'active');

INSERT INTO users (tenant_id, username, password, email, full_name, role, status) 
VALUES ('000001', 'superadmin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@system.com', 'Super Administrator', 'super_admin', 'active');

-- Insert demo tenant and users (tenant: 123456)
INSERT INTO tenants (tenant_id, company_name, subscription_plan, subscription_status) 
VALUES ('123456', 'Demo Accounting Company', 'premium', 'active');

-- Demo users for tenant 123456 (all passwords are the username + "123")
INSERT INTO users (tenant_id, username, password, email, full_name, role, status) VALUES
('123456', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@demo.com', 'Demo Administrator', 'admin', 'active'),
('123456', 'accountant', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'accountant@demo.com', 'Demo Accountant', 'accountant', 'active'),
('123456', 'auditor', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'auditor@demo.com', 'Demo Auditor', 'auditor', 'active'),
('123456', 'viewer', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'viewer@demo.com', 'Demo Viewer', 'viewer', 'active');

-- Chart of Accounts for Demo Tenant (123456) - 4 Level Structure
-- Level 1: Main Categories (1000-9000)
INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, account_sub_type, parent_account_id, is_active, description, created_by) VALUES
-- ASSETS (1000-1999)
('123456', '1000', 'ASSETS', 'asset', 'main_category', NULL, TRUE, 'All company assets', 2),

-- LIABILITIES (2000-2999)
('123456', '2000', 'LIABILITIES', 'liability', 'main_category', NULL, TRUE, 'All company liabilities', 2),

-- EQUITY (3000-3999)
('123456', '3000', 'EQUITY', 'equity', 'main_category', NULL, TRUE, 'Owner equity and capital', 2),

-- REVENUE (4000-4999)
('123456', '4000', 'REVENUE', 'revenue', 'main_category', NULL, TRUE, 'All company income and revenue', 2),

-- EXPENSES (5000-5999)
('123456', '5000', 'EXPENSES', 'expense', 'main_category', NULL, TRUE, 'All company expenses and costs', 2),

-- OTHER INCOME (6000-6999)
('123456', '6000', 'OTHER INCOME', 'revenue', 'other', NULL, TRUE, 'Non-operating income', 2),

-- OTHER EXPENSES (7000-7999)
('123456', '7000', 'OTHER EXPENSES', 'expense', 'other', NULL, TRUE, 'Non-operating expenses', 2);

-- Level 2: Sub Categories
INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, account_sub_type, parent_account_id, is_active, description, created_by) VALUES
-- CURRENT ASSETS (1100-1199)
('123456', '1100', 'Current Assets', 'asset', 'current', 1, TRUE, 'Assets convertible to cash within one year', 2),
('123456', '1200', 'Accounts Receivable', 'asset', 'current', 1, TRUE, 'Money owed by customers', 2),
('123456', '1300', 'Inventory', 'asset', 'current', 1, TRUE, 'Goods held for sale', 2),
('123456', '1400', 'Prepaid Expenses', 'asset', 'current', 1, TRUE, 'Expenses paid in advance', 2),

-- NON-CURRENT ASSETS (1500-1899)
('123456', '1500', 'Property, Plant & Equipment', 'asset', 'non_current', 1, TRUE, 'Long-term physical assets', 2),
('123456', '1600', 'Intangible Assets', 'asset', 'non_current', 1, TRUE, 'Non-physical assets with value', 2),
('123456', '1700', 'Investments', 'asset', 'non_current', 1, TRUE, 'Long-term investments', 2),
('123456', '1800', 'Other Assets', 'asset', 'non_current', 1, TRUE, 'Other long-term assets', 2),

-- CURRENT LIABILITIES (2100-2199)
('123456', '2100', 'Current Liabilities', 'liability', 'current', 2, TRUE, 'Debts due within one year', 2),
('123456', '2200', 'Accounts Payable', 'liability', 'current', 2, TRUE, 'Money owed to suppliers', 2),
('123456', '2300', 'Accrued Expenses', 'liability', 'current', 2, TRUE, 'Expenses incurred but not yet paid', 2),
('123456', '2400', 'Short-term Loans', 'liability', 'current', 2, TRUE, 'Loans due within one year', 2),

-- NON-CURRENT LIABILITIES (2500-2999)
('123456', '2500', 'Long-term Liabilities', 'liability', 'non_current', 2, TRUE, 'Debts due after one year', 2),
('123456', '2600', 'Long-term Loans', 'liability', 'non_current', 2, TRUE, 'Loans due after one year', 2),
('123456', '2700', 'Bonds Payable', 'liability', 'non_current', 2, TRUE, 'Long-term bond obligations', 2),

-- EQUITY SUB-CATEGORIES (3100-3999)
('123456', '3100', 'Share Capital', 'equity', 'capital', 3, TRUE, 'Issued share capital', 2),
('123456', '3200', 'Retained Earnings', 'equity', 'capital', 3, TRUE, 'Accumulated profits', 2),
('123456', '3300', 'Capital Reserves', 'equity', 'capital', 3, TRUE, 'Capital reserves and surplus', 2),
('123456', '3400', 'Current Year Earnings', 'equity', 'capital', 3, TRUE, 'Current year profit/loss', 2),

-- OPERATING REVENUE (4100-4199)
('123456', '4100', 'Sales Revenue', 'revenue', 'operating', 4, TRUE, 'Revenue from product sales', 2),
('123456', '4200', 'Service Revenue', 'revenue', 'operating', 4, TRUE, 'Revenue from services', 2),
('123456', '4300', 'Consulting Revenue', 'revenue', 'operating', 4, TRUE, 'Revenue from consulting', 2),
('123456', '4400', 'Other Operating Revenue', 'revenue', 'operating', 4, TRUE, 'Other operating income', 2),

-- COST OF GOODS SOLD (5100-5199)
('123456', '5100', 'Cost of Goods Sold', 'expense', 'cost_of_sales', 5, TRUE, 'Direct costs of goods sold', 2),
('123456', '5200', 'Cost of Services', 'expense', 'cost_of_sales', 5, TRUE, 'Direct costs of services', 2),

-- OPERATING EXPENSES (5300-5799)
('123456', '5300', 'Salaries and Wages', 'expense', 'operating', 5, TRUE, 'Employee salaries and wages', 2),
('123456', '5400', 'Office Expenses', 'expense', 'operating', 5, TRUE, 'General office expenses', 2),
('123456', '5500', 'Marketing Expenses', 'expense', 'operating', 5, TRUE, 'Marketing and advertising costs', 2),
('123456', '5600', 'Administrative Expenses', 'expense', 'operating', 5, TRUE, 'Administrative costs', 2),
('123456', '5700', 'Utilities', 'expense', 'operating', 5, TRUE, 'Electricity, water, gas, internet', 2),

-- FINANCIAL EXPENSES (5800-5899)
('123456', '5800', 'Financial Expenses', 'expense', 'financial', 5, TRUE, 'Interest and financial costs', 2);

-- Get the account IDs for parent references (Level 3 accounts)
SET @current_assets_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '1100');
SET @accounts_receivable_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '1200');
SET @inventory_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '1300');
SET @prepaid_expenses_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '1400');
SET @ppe_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '1500');
SET @current_liabilities_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '2100');
SET @accounts_payable_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '2200');
SET @accrued_expenses_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '2300');
SET @sales_revenue_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '4100');
SET @cogs_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '5100');
SET @salaries_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '5300');
SET @office_expenses_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '5400');

-- Level 3: Detailed Sub-categories
INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, account_sub_type, parent_account_id, is_active, description, created_by) VALUES
-- Cash and Cash Equivalents (under Current Assets)
('123456', '1110', 'Cash and Cash Equivalents', 'asset', 'current', @current_assets_id, TRUE, 'Cash on hand and in banks', 2),
('123456', '1120', 'Short-term Investments', 'asset', 'current', @current_assets_id, TRUE, 'Investments maturing within 90 days', 2),
('123456', '1130', 'Marketable Securities', 'asset', 'current', @current_assets_id, TRUE, 'Readily marketable securities', 2),

-- Accounts Receivable Details
('123456', '1210', 'Trade Receivables', 'asset', 'current', @accounts_receivable_id, TRUE, 'Receivables from customers', 2),
('123456', '1220', 'Other Receivables', 'asset', 'current', @accounts_receivable_id, TRUE, 'Non-trade receivables', 2),
('123456', '1230', 'Allowance for Doubtful Accounts', 'asset', 'current', @accounts_receivable_id, TRUE, 'Provision for bad debts', 2),

-- Inventory Details
('123456', '1310', 'Raw Materials', 'asset', 'current', @inventory_id, TRUE, 'Raw materials inventory', 2),
('123456', '1320', 'Work in Progress', 'asset', 'current', @inventory_id, TRUE, 'Partially completed goods', 2),
('123456', '1330', 'Finished Goods', 'asset', 'current', @inventory_id, TRUE, 'Completed goods ready for sale', 2),

-- Prepaid Expenses Details
('123456', '1410', 'Prepaid Insurance', 'asset', 'current', @prepaid_expenses_id, TRUE, 'Insurance paid in advance', 2),
('123456', '1420', 'Prepaid Rent', 'asset', 'current', @prepaid_expenses_id, TRUE, 'Rent paid in advance', 2),
('123456', '1430', 'Other Prepaid Expenses', 'asset', 'current', @prepaid_expenses_id, TRUE, 'Other prepayments', 2),

-- Property, Plant & Equipment Details
('123456', '1510', 'Land', 'asset', 'non_current', @ppe_id, TRUE, 'Land and property', 2),
('123456', '1520', 'Buildings', 'asset', 'non_current', @ppe_id, TRUE, 'Buildings and structures', 2),
('123456', '1530', 'Equipment', 'asset', 'non_current', @ppe_id, TRUE, 'Machinery and equipment', 2),
('123456', '1540', 'Vehicles', 'asset', 'non_current', @ppe_id, TRUE, 'Company vehicles', 2),
('123456', '1550', 'Furniture and Fixtures', 'asset', 'non_current', @ppe_id, TRUE, 'Office furniture and fixtures', 2),
('123456', '1560', 'Accumulated Depreciation', 'asset', 'non_current', @ppe_id, TRUE, 'Accumulated depreciation on assets', 2),

-- Current Liabilities Details
('123456', '2110', 'Bank Overdraft', 'liability', 'current', @current_liabilities_id, TRUE, 'Bank overdraft facilities', 2),
('123456', '2120', 'Credit Cards Payable', 'liability', 'current', @current_liabilities_id, TRUE, 'Credit card balances', 2),

-- Accounts Payable Details
('123456', '2210', 'Trade Payables', 'liability', 'current', @accounts_payable_id, TRUE, 'Payables to suppliers', 2),
('123456', '2220', 'Other Payables', 'liability', 'current', @accounts_payable_id, TRUE, 'Non-trade payables', 2),

-- Accrued Expenses Details
('123456', '2310', 'Accrued Salaries', 'liability', 'current', @accrued_expenses_id, TRUE, 'Salaries earned but not paid', 2),
('123456', '2320', 'Accrued Interest', 'liability', 'current', @accrued_expenses_id, TRUE, 'Interest accrued but not paid', 2),
('123456', '2330', 'Accrued Taxes', 'liability', 'current', @accrued_expenses_id, TRUE, 'Taxes accrued but not paid', 2),

-- Sales Revenue Details
('123456', '4110', 'Product Sales', 'revenue', 'operating', @sales_revenue_id, TRUE, 'Revenue from product sales', 2),
('123456', '4120', 'Service Sales', 'revenue', 'operating', @sales_revenue_id, TRUE, 'Revenue from service sales', 2),
('123456', '4130', 'Rental Income', 'revenue', 'operating', @sales_revenue_id, TRUE, 'Income from rentals', 2),

-- COGS Details
('123456', '5110', 'Materials Cost', 'expense', 'cost_of_sales', @cogs_id, TRUE, 'Cost of raw materials', 2),
('123456', '5120', 'Labor Cost', 'expense', 'cost_of_sales', @cogs_id, TRUE, 'Direct labor costs', 2),
('123456', '5130', 'Manufacturing Overhead', 'expense', 'cost_of_sales', @cogs_id, TRUE, 'Manufacturing overhead costs', 2),

-- Salaries and Wages Details
('123456', '5310', 'Management Salaries', 'expense', 'operating', @salaries_id, TRUE, 'Management salaries', 2),
('123456', '5320', 'Staff Salaries', 'expense', 'operating', @salaries_id, TRUE, 'Staff salaries', 2),
('123456', '5330', 'Overtime Pay', 'expense', 'operating', @salaries_id, TRUE, 'Overtime payments', 2),
('123456', '5340', 'Bonuses', 'expense', 'operating', @salaries_id, TRUE, 'Employee bonuses', 2),
('123456', '5350', 'Employee Benefits', 'expense', 'operating', @salaries_id, TRUE, 'Health insurance, retirement, etc.', 2),

-- Office Expenses Details
('123456', '5410', 'Office Supplies', 'expense', 'operating', @office_expenses_id, TRUE, 'Stationery, supplies, etc.', 2),
('123456', '5420', 'Office Rent', 'expense', 'operating', @office_expenses_id, TRUE, 'Office space rental', 2),
('123456', '5430', 'Communications', 'expense', 'operating', @office_expenses_id, TRUE, 'Phone, internet, postage', 2),
('123456', '5440', 'Equipment Rental', 'expense', 'operating', @office_expenses_id, TRUE, 'Equipment rental costs', 2);

-- Get Level 3 account IDs for Level 4 accounts
SET @cash_equivalents_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '1110');
SET @trade_receivables_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '1210');
SET @finished_goods_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '1330');
SET @buildings_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '1520');
SET @equipment_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '1530');
SET @trade_payables_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '2210');
SET @product_sales_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '4110');
SET @materials_cost_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '5110');
SET @management_salaries_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '5310');
SET @office_supplies_id = (SELECT id FROM chart_of_accounts WHERE tenant_id = '123456' AND account_code = '5410');

-- Level 4: Most Detailed Accounts
INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, account_sub_type, parent_account_id, is_active, description, created_by) VALUES
-- Cash Details (Level 4)
('123456', '1111', 'Cash in Hand - Main Office', 'asset', 'current', @cash_equivalents_id, TRUE, 'Petty cash at main office', 2),
('123456', '1112', 'Cash in Hand - Branch Office', 'asset', 'current', @cash_equivalents_id, TRUE, 'Petty cash at branch office', 2),
('123456', '1113', 'Bank Account - ABC Bank Checking', 'asset', 'current', @cash_equivalents_id, TRUE, 'Primary checking account', 2),
('123456', '1114', 'Bank Account - ABC Bank Savings', 'asset', 'current', @cash_equivalents_id, TRUE, 'Primary savings account', 2),
('123456', '1115', 'Bank Account - XYZ Bank Business', 'asset', 'current', @cash_equivalents_id, TRUE, 'Secondary business account', 2),

-- Trade Receivables Details (Level 4)
('123456', '1211', 'Domestic Customers', 'asset', 'current', @trade_receivables_id, TRUE, 'Receivables from domestic customers', 2),
('123456', '1212', 'International Customers', 'asset', 'current', @trade_receivables_id, TRUE, 'Receivables from international customers', 2),
('123456', '1213', 'Government Contracts', 'asset', 'current', @trade_receivables_id, TRUE, 'Receivables from government contracts', 2),
('123456', '1214', 'Related Party Receivables', 'asset', 'current', @trade_receivables_id, TRUE, 'Receivables from related companies', 2),

-- Finished Goods Details (Level 4)
('123456', '1331', 'Product Line A', 'asset', 'current', @finished_goods_id, TRUE, 'Finished goods - Product Line A', 2),
('123456', '1332', 'Product Line B', 'asset', 'current', @finished_goods_id, TRUE, 'Finished goods - Product Line B', 2),
('123456', '1333', 'Product Line C', 'asset', 'current', @finished_goods_id, TRUE, 'Finished goods - Product Line C', 2),
('123456', '1334', 'Discontinued Products', 'asset', 'current', @finished_goods_id, TRUE, 'Discontinued product inventory', 2),

-- Buildings Details (Level 4)
('123456', '1521', 'Main Office Building', 'asset', 'non_current', @buildings_id, TRUE, 'Main office building', 2),
('123456', '1522', 'Warehouse Building', 'asset', 'non_current', @buildings_id, TRUE, 'Warehouse facility', 2),
('123456', '1523', 'Branch Office Building', 'asset', 'non_current', @buildings_id, TRUE, 'Branch office building', 2),

-- Equipment Details (Level 4)
('123456', '1531', 'Manufacturing Equipment', 'asset', 'non_current', @equipment_id, TRUE, 'Production machinery', 2),
('123456', '1532', 'Office Equipment', 'asset', 'non_current', @equipment_id, TRUE, 'Computers, printers, etc.', 2),
('123456', '1533', 'IT Equipment', 'asset', 'non_current', @equipment_id, TRUE, 'Servers, network equipment', 2),
('123456', '1534', 'Testing Equipment', 'asset', 'non_current', @equipment_id, TRUE, 'Quality control equipment', 2),

-- Trade Payables Details (Level 4)
('123456', '2211', 'Domestic Suppliers', 'liability', 'current', @trade_payables_id, TRUE, 'Payables to domestic suppliers', 2),
('123456', '2212', 'International Suppliers', 'liability', 'current', @trade_payables_id, TRUE, 'Payables to international suppliers', 2),
('123456', '2213', 'Utility Companies', 'liability', 'current', @trade_payables_id, TRUE, 'Payables to utility companies', 2),
('123456', '2214', 'Service Providers', 'liability', 'current', @trade_payables_id, TRUE, 'Payables to service providers', 2),

-- Product Sales Details (Level 4)
('123456', '4111', 'Product Line A Sales', 'revenue', 'operating', @product_sales_id, TRUE, 'Sales revenue from Product Line A', 2),
('123456', '4112', 'Product Line B Sales', 'revenue', 'operating', @product_sales_id, TRUE, 'Sales revenue from Product Line B', 2),
('123456', '4113', 'Product Line C Sales', 'revenue', 'operating', @product_sales_id, TRUE, 'Sales revenue from Product Line C', 2),
('123456', '4114', 'Clearance Sales', 'revenue', 'operating', @product_sales_id, TRUE, 'Revenue from clearance sales', 2),

-- Materials Cost Details (Level 4)
('123456', '5111', 'Raw Material A', 'expense', 'cost_of_sales', @materials_cost_id, TRUE, 'Cost of raw material A', 2),
('123456', '5112', 'Raw Material B', 'expense', 'cost_of_sales', @materials_cost_id, TRUE, 'Cost of raw material B', 2),
('123456', '5113', 'Packaging Materials', 'expense', 'cost_of_sales', @materials_cost_id, TRUE, 'Cost of packaging materials', 2),
('123456', '5114', 'Consumable Supplies', 'expense', 'cost_of_sales', @materials_cost_id, TRUE, 'Cost of consumable supplies', 2),

-- Management Salaries Details (Level 4)
('123456', '5311', 'CEO Salary', 'expense', 'operating', @management_salaries_id, TRUE, 'Chief Executive Officer salary', 2),
('123456', '5312', 'CFO Salary', 'expense', 'operating', @management_salaries_id, TRUE, 'Chief Financial Officer salary', 2),
('123456', '5313', 'Department Head Salaries', 'expense', 'operating', @management_salaries_id, TRUE, 'Department head salaries', 2),
('123456', '5314', 'Middle Management Salaries', 'expense', 'operating', @management_salaries_id, TRUE, 'Middle management salaries', 2),

-- Office Supplies Details (Level 4)
('123456', '5411', 'Stationery', 'expense', 'operating', @office_supplies_id, TRUE, 'Paper, pens, folders, etc.', 2),
('123456', '5412', 'Computer Supplies', 'expense', 'operating', @office_supplies_id, TRUE, 'Ink cartridges, USB drives, etc.', 2),
('123456', '5413', 'Cleaning Supplies', 'expense', 'operating', @office_supplies_id, TRUE, 'Cleaning materials and supplies', 2),
('123456', '5414', 'Pantry Supplies', 'expense', 'operating', @office_supplies_id, TRUE, 'Coffee, tea, snacks for office', 2);