// Database Models for DMS Application
// All models follow the database structure specified in requirements

export interface Product {
  productid?: number;
  code?: string;
  companyid: number;
  brand?: string;
  product_name: string;
  units_in_pack: number;
  sprice: number;
  shortstock?: number;
  reorder?: number;
  unit?: string;
  statusid: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Company {
  companyid?: number;
  companyname: string;
  address?: string;
  phone?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Salesman {
  salesmanid?: number;
  salesmanname: string;
  address?: string;
  mobileno?: string;
  login_allowed: boolean;
  username?: string;
  password?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Route {
  routeid?: number;
  routename: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface SalesmanRoute {
  id?: number;
  salesmanid: number;
  routeid: number;
  assigned_date?: Date;
  is_active: boolean;
}

export interface Subscriber {
  subscriberid?: number;
  business_name: string;
  address1: string;
  address2?: string;
  phoneno?: string;
  mobileno: string;
  city: string;
  email?: string;
  proprietor: string;
  expiry_date: Date;
  renewal_amount: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Stock {
  stockid?: number;
  productid: number;
  qty: number;
  pprice: number; // purchase price
  batch_no?: string;
  expiry_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface Invoice {
  invoiceid?: number;
  date: Date;
  routeid: number;
  salesmanid: number;
  account_id: number;
  is_cash: boolean;
  amount: number;
  discount: number;
  scheme: number;
  tax: number;
  net_amount: number;
  dt_cr: 'sale' | 'return';
  notes?: string;
  sync_status?: 'pending' | 'synced' | 'failed';
  created_at?: Date;
  updated_at?: Date;
}

export interface InvoiceDetail {
  detailid?: number;
  invoiceid: number;
  productid: number;
  qty: number;
  sprice: number; // sale price
  pprice: number; // purchase price
  disc_age: number; // discount percentage
  scheme: number;
  bonus: number;
  tax_ratio: number;
  net_amount: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface PurchaseInvoice {
  invoiceid?: number;
  date: Date;
  inv_date: Date;
  inv_no: string;
  account_id: number;
  amount: number;
  discount: number;
  scheme: number;
  tax: number;
  net_amount: number;
  dt_cr: 'purchase' | 'return';
  notes?: string;
  sync_status?: 'pending' | 'synced' | 'failed';
  created_at?: Date;
  updated_at?: Date;
}

export interface PurchaseInvoiceDetail {
  detailid?: number;
  invoiceid: number;
  productid: number;
  qty: number;
  sprice: number;
  pprice: number;
  disc_age: number;
  scheme: number;
  bonus: number;
  tax_ratio: number;
  net_amount: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Voucher {
  voucher_id?: number;
  date: Date;
  account_id: number;
  description?: string;
  debit: number;
  credit: number;
  voucher_type: 'recovery' | 'payment' | 'receipt' | 'expense';
  reference_no?: string;
  sync_status?: 'pending' | 'synced' | 'failed';
  created_at?: Date;
  updated_at?: Date;
}

export interface Account {
  account_id?: number;
  acct_type: 'customer' | 'supplier' | 'expense' | 'income' | 'asset' | 'liability';
  account_name: string;
  address?: string;
  phone_no1?: string;
  phone_no2?: string;
  city?: string;
  routeid?: number;
  opening_balance?: number;
  credit_limit?: number;
  created_at?: Date;
  updated_at?: Date;
}

// Additional models for reports and analytics
export interface DailySummary {
  id?: number;
  date: Date;
  salesmanid: number;
  routeid: number;
  total_sales: number;
  total_recovery: number;
  total_expenses: number;
  cash_in_hand: number;
  created_at?: Date;
}

export interface StockLedger {
  id?: number;
  productid: number;
  transaction_type: 'purchase' | 'sale' | 'return' | 'adjustment';
  reference_id: number; // invoice id or voucher id
  qty_in: number;
  qty_out: number;
  balance_qty: number;
  rate: number;
  amount: number;
  date: Date;
  created_at?: Date;
}

// Enum for common status
export enum RecordStatus {
  ACTIVE = 1,
  INACTIVE = 0,
  DELETED = -1
}

// Sync status for offline support
export interface SyncQueue {
  id?: number;
  table_name: string;
  record_id: number;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  sync_status: 'pending' | 'synced' | 'failed';
  retry_count: number;
  last_attempt?: Date;
  created_at: Date;
}

// App configuration
export interface AppConfig {
  id?: number;
  key: string;
  value: string;
  description?: string;
  updated_at?: Date;
}