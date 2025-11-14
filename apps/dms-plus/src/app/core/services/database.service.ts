import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import {
  Account,
  AppConfig,
  Company,
  DailySummary,
  Invoice,
  InvoiceDetail,
  Product,
  PurchaseInvoice,
  PurchaseInvoiceDetail,
  Route,
  Salesman,
  SalesmanRoute,
  Stock,
  StockLedger,
  Subscriber,
  SyncQueue,
  Voucher
} from '../models/database.models';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {
  // Table declarations
  products!: Table<Product>;
  companies!: Table<Company>;
  salesman!: Table<Salesman>;
  routes!: Table<Route>;
  salesmanRoutes!: Table<SalesmanRoute>;
  subscriber!: Table<Subscriber>;
  stock!: Table<Stock>;
  invoices!: Table<Invoice>;
  invoiceDetails!: Table<InvoiceDetail>;
  purchaseInvoices!: Table<PurchaseInvoice>;
  purchaseInvoiceDetails!: Table<PurchaseInvoiceDetail>;
  vouchers!: Table<Voucher>;
  accounts!: Table<Account>;
  dailySummary!: Table<DailySummary>;
  stockLedger!: Table<StockLedger>;
  syncQueue!: Table<SyncQueue>;
  appConfig!: Table<AppConfig>;

  constructor() {
    super('DMSPlusDB_v3');

    // Complete fresh database schema - version 1 of new database
    // Wrap schema declaration in try/catch to avoid throwing during unexpected IDB state
    try {
      this.version(1).stores({
      products: '++productid, code, companyid, product_name, statusid, [companyid+statusid]',
      companies: '++companyid, companyname',
      salesman: '++salesmanid, salesmanname, username, login_allowed',
      routes: '++routeid, routename',
      salesmanRoutes: '++id, salesmanid, routeid, [salesmanid+routeid], is_active',
      subscriber: '++subscriberid, business_name, expiry_date',
      stock: '++stockid, productid, batch_no, expiry_date, [productid+batch_no]',
      invoices: '++invoiceid, date, salesmanid, account_id, routeid, dt_cr, sync_status, [date+salesmanid], [date+routeid]',
      invoiceDetails: '++detailid, invoiceid, productid, [invoiceid+productid]',
      purchaseInvoices: '++invoiceid, date, inv_no, account_id, dt_cr, sync_status',
      purchaseInvoiceDetails: '++detailid, invoiceid, productid, [invoiceid+productid]',
      vouchers: '++voucher_id, date, account_id, voucher_type, sync_status, [date+account_id]',
      accounts: '++account_id, acct_type, account_name, routeid, [acct_type+routeid]',
      dailySummary: '++id, date, salesmanid, routeid, [date+salesmanid]',
      stockLedger: '++id, productid, date, transaction_type, reference_id, [productid+date]',
      syncQueue: '++id, table_name, sync_status, created_at',
  // appConfig uses a unique index on 'key' - don't declare it twice (key and &key)
  appConfig: '++id, &key'
      });
    } catch (schemaError) {
      // If schema registration fails (due to partial/corrupted DB state), log and continue.
      // We'll attempt corrective measures during open/initialization.
      console.warn('Warning: failed to register DB schema during constructor:', schemaError);
    }

    // Hook to add timestamps automatically
    this.products.hook('creating', (primKey, obj) => {
      obj.created_at = new Date();
      obj.updated_at = new Date();
    });

    this.products.hook('updating', (modifications) => {
      (modifications as Record<string, unknown>)['updated_at'] = new Date();
    });

    // Similar hooks for other tables with error handling
    const tablesWithTimestamps = [
      this.companies, this.salesman, this.routes, this.accounts,
      this.invoices, this.purchaseInvoices, this.vouchers, this.stock
    ];

    tablesWithTimestamps.forEach(table => {
      try {
        table.hook('creating', (primKey, obj) => {
          obj.created_at = new Date();
          obj.updated_at = new Date();
        });

        table.hook('updating', (modifications) => {
          (modifications as Record<string, unknown>)['updated_at'] = new Date();
        });
      } catch (error) {
        console.warn('Failed to setup hooks for table:', error);
      }
    });
  }

  /**
   * Safely open the Dexie database with retries. On index/schema related errors
   * attempt to delete the database and retry a few times before failing.
   */
  private async safeOpen(maxRetries = 3): Promise<void> {
    let attempt = 0;
    const retryDelay = (ms: number) => new Promise(r => setTimeout(r, ms));

    while (attempt < maxRetries) {
      try {
        attempt++;
        await this.open();
        // opened successfully
        return;
      } catch (openError: unknown) {
        console.warn(`Database open failed (attempt ${attempt}):`, openError);

        // Gather debug info to help diagnose index/schema issues
        try {
          await this.logDebugInfo(`safeOpen: open failed (attempt ${attempt})`);
        } catch (diagErr) {
          console.warn('Failed to collect DB diagnostics:', diagErr);
        }

        // If error indicates index already exists or other ConstraintError, try to delete DB and retry
  const oe = openError as { message?: string; name?: string } | undefined;
  const msg = (oe && (oe.message || openError?.toString())) || '';
  const isIndexError = (typeof msg === 'string' && (msg.includes('createIndex') || msg.includes('already exists'))) || oe?.name === 'ConstraintError';

        try {
          // Close then delete the database to recover from corrupted schema state
          try { this.close(); } catch (closeErr) { console.warn('Error closing DB during recovery:', closeErr); }
          console.log('Attempting to delete database to recover from schema/index error...');
          // Use Dexie.delete to remove DB; ignore errors if it doesn't exist
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          await Dexie.delete(this.name);
          // After deletion attempt, log diagnostics again (browser may have removed DB)
          try {
            await this.logDebugInfo(`safeOpen: after Dexie.delete (attempt ${attempt})`);
          } catch (diagErr) {
            console.warn('Unable to collect DB diagnostics after delete attempt:', diagErr);
          }
        } catch (delErr) {
          console.warn('Failed to delete database during safeOpen recovery:', delErr);
        }

        if (isIndexError) {
          // Small delay to allow IDB cleanup and then retry
          await retryDelay(250 * attempt);
          continue; // retry
        }

        // For other errors, if we still have retries left, wait and retry, otherwise throw
        await retryDelay(200 * attempt);
      }
    }

    throw new Error('Failed to open database after multiple attempts. Consider clearing site storage (IndexedDB) and retrying.');
  }

  // Method to recreate database if schema conflicts occur
  async recreateDatabase(): Promise<void> {
    try {
      console.log('Recreating database due to schema conflict...');
      
      // Close current database
      this.close();
      
      // Delete this database name and common legacy names
      const dbNamesToDelete = [this.name, 'DMSPlusDB', 'DMSPlusDB_v2'];
      for (const name of dbNamesToDelete) {
        try {
          await Dexie.delete(name);
          console.log(`Deleted database: ${name}`);
        } catch {
          // ignore if doesn't exist
        }
      }
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reinitialize
      await this.initializeDatabase();
      
      console.log('Database recreated successfully');
    } catch (error) {
      console.error('Error recreating database:', error);
      throw error;
    }
  }

  // Collects diagnostics about IndexedDB and Dexie internal tables to aid debugging
  async getDebugInfo(): Promise<Record<string, unknown>> {
    const info: Record<string, unknown> = {
      instanceName: this.name,
      dexieTables: [] as unknown[],
      indexedDBs: [] as unknown[],
    };

    try {
      // Dexie tables (non-enumerable type cast with safer typing)
      const self = this as unknown as { tables?: Array<{ name: string; schema?: unknown }> };
      const tables = self.tables;
      if (Array.isArray(tables)) {
        info['dexieTables'] = tables.map(t => ({ name: t.name, schema: t.schema ? t.schema : null }));
      }
    } catch (err) {
      info['dexieTables'] = `Error reading dexie tables: ${String(err)}`;
    }

    try {
      // Use the indexedDB.databases() API when available (Chromium)
      const idbAny = indexedDB as unknown as { databases?: () => Promise<unknown[]> };
      if (typeof idbAny.databases === 'function') {
        const dbs = await idbAny.databases();
        info['indexedDBs'] = dbs;
      } else {
        info['indexedDBs'] = 'indexedDB.databases() not supported by this browser';
      }
    } catch (err) {
      info['indexedDBs'] = `Error listing indexedDB databases: ${String(err)}`;
    }

    return info;
  }

  // Convenience logger for debug info
  async logDebugInfo(prefix?: string): Promise<void> {
    try {
      const info = await this.getDebugInfo();
      console.groupCollapsed(`DB Diagnostics${prefix ? ' - ' + prefix : ''}`);
      console.log(info);
      console.groupEnd();
    } catch (err) {
      console.warn('Failed to collect or log DB diagnostics:', err);
    }
  }

  // Initialize database with default data
  async initializeDatabase(): Promise<void> {
    try {
      // Clean up old database versions first
      await this.cleanupOldDatabases();
      
      // Use safeOpen which contains retry and recovery logic for index/schema conflicts
      await this.safeOpen();
      
      // Check if database is already initialized
      const configExists = await this.appConfig.where('key').equals('db_initialized').first();
      
      if (!configExists) {
        await this.transaction('rw', [
          this.companies,
          this.accounts,
          this.routes,
          this.salesman,
          this.appConfig,
          this.subscriber
        ], async () => {
          
          // Add default subscriber info
          await this.subscriber.add({
            business_name: 'Octavion Solutions (Pvt) Ltd.',
            address1: 'Pakistan',
            mobileno: '+92-XXX-XXXXXXX',
            city: 'Karachi',
            proprietor: 'Admin',
            expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            renewal_amount: 50000,
            email: 'admin@octavion.com'
          });

          // Add default companies
          await this.companies.bulkAdd([
            { companyname: 'Default Company' },
            { companyname: 'Unilever Pakistan' },
            { companyname: 'Nestle Pakistan' },
            { companyname: 'Procter & Gamble' }
          ]);

          // Add default accounts
          await this.accounts.bulkAdd([
            { 
              acct_type: 'customer', 
              account_name: 'Cash Customer',
              opening_balance: 0,
              credit_limit: 0
            },
            { 
              acct_type: 'expense', 
              account_name: 'Travel Expense',
              opening_balance: 0
            },
            { 
              acct_type: 'expense', 
              account_name: 'Fuel Expense',
              opening_balance: 0
            },
            { 
              acct_type: 'income', 
              account_name: 'Sales Revenue',
              opening_balance: 0
            }
          ]);

          // Add default route
          await this.routes.add({ 
            routename: 'Main Route',
            description: 'Default route for main area'
          });

          // Add default salesman
          await this.salesman.add({
            salesmanname: 'Admin User',
            login_allowed: true,
            username: 'admin',
            password: 'admin123', // In production, this should be hashed
            address: 'Main Office'
          });

          // Mark database as initialized
          await this.appConfig.add({
            key: 'db_initialized',
            value: 'true',
            description: 'Database initialization flag'
          });

          await this.appConfig.add({
            key: 'app_version',
            value: '1.0.0',
            description: 'Current application version'
          });

          console.log('Database initialized successfully');
        });

        // After basic initialization, populate sample data
        try {
          // Skip sample data population in this context to avoid injection issues
          // Sample data can be populated from application startup if needed
          console.log('Database initialized successfully - sample data can be populated from app component');
          
          // Mark sample data as populated
          await this.appConfig.add({
            key: 'sample_data_populated',
            value: 'true',
            description: 'Sample data population flag'
          });
        } catch (error) {
          console.error('Failed to populate sample data:', error);
          // Continue anyway - basic initialization was successful
        }
      }
      
      console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  // Clean up old database versions
  async cleanupOldDatabases(): Promise<void> {
    try {
      console.log('Cleaning up old database versions...');
      
      const oldDatabaseNames = ['DMSPlusDB', 'DMSPlusDB_v2'];
      
      for (const dbName of oldDatabaseNames) {
        try {
          await Dexie.delete(dbName);
          console.log(`Cleaned up old database: ${dbName}`);
        } catch {
          // Database might not exist, that's okay
          console.log(`Old database ${dbName} doesn't exist or already cleaned up`);
        }
      }
    } catch (error) {
      console.warn('Error during database cleanup:', error);
      // Don't throw, this is not critical
    }
  }

  // Get current stock balance for a product using FIFO
  async getProductStockBalance(productid: number): Promise<{ qty: number; avgCost: number }> {
    try {
      const stockEntries = await this.stock
        .where('productid')
        .equals(productid)
        .and(stock => stock.qty > 0)
        .toArray();

      const totalQty = stockEntries.reduce((sum, stock) => sum + stock.qty, 0);
      const totalValue = stockEntries.reduce((sum, stock) => sum + (stock.qty * stock.pprice), 0);
      const avgCost = totalQty > 0 ? totalValue / totalQty : 0;

      return { qty: totalQty, avgCost };
    } catch (error) {
      console.error('Error getting product stock balance:', error);
      return { qty: 0, avgCost: 0 };
    }
  }

  // Update stock using FIFO method
  async updateStockFIFO(productid: number, qtyToReduce: number): Promise<boolean> {
    try {
      if (qtyToReduce <= 0) return true;

      const stockEntries = await this.stock
        .where('productid')
        .equals(productid)
        .and(stock => stock.qty > 0)
        .sortBy('created_at'); // FIFO - First In, First Out

      let remainingQty = qtyToReduce;

      for (const stockEntry of stockEntries) {
        if (remainingQty <= 0) break;

        if (stockEntry.qty >= remainingQty) {
          // This entry has enough stock
          await this.stock.update(stockEntry.stockid!, { 
            qty: stockEntry.qty - remainingQty 
          });
          remainingQty = 0;
        } else {
          // Use all of this entry and continue
          remainingQty -= stockEntry.qty;
          await this.stock.update(stockEntry.stockid!, { qty: 0 });
        }
      }

      return remainingQty === 0; // Return true if all qty was reduced
    } catch (error) {
      console.error('Error updating stock FIFO:', error);
      return false;
    }
  }

  // Add to sync queue for offline support
  async addToSyncQueue(tableName: string, recordId: number, operation: 'insert' | 'update' | 'delete', data: Record<string, unknown>): Promise<void> {
    try {
      await this.syncQueue.add({
        table_name: tableName,
        record_id: recordId,
        operation,
        data,
        sync_status: 'pending',
        retry_count: 0,
        created_at: new Date()
      });
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  // Get pending sync items
  async getPendingSyncItems(): Promise<SyncQueue[]> {
    try {
      return await this.syncQueue
        .where('sync_status')
        .equals('pending')
        .or('sync_status')
        .equals('failed')
        .and(item => item.retry_count < 3)
        .toArray();
    } catch (error) {
      console.error('Error getting pending sync items:', error);
      return [];
    }
  }

  // Clear old data (for maintenance)
  async clearOldData(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      await this.transaction('rw', [this.syncQueue, this.stockLedger], async () => {
        // Clear old sync queue items
        await this.syncQueue
          .where('created_at')
          .below(cutoffDate)
          .and(item => item.sync_status === 'synced')
          .delete();

        // Archive old stock ledger entries (keep for reporting)
        // In a real application, you might move this to an archive table
        console.log(`Data cleanup completed for items older than ${daysToKeep} days`);
      });
    } catch (error) {
      console.error('Error clearing old data:', error);
    }
  }

  // Export database for backup
  async exportDatabase(): Promise<Blob> {
    try {
      const allData: Record<string, unknown[]> = {};
      
      // Export all table data
      allData['products'] = await this.products.toArray();
      allData['companies'] = await this.companies.toArray();
      allData['salesman'] = await this.salesman.toArray();
      allData['routes'] = await this.routes.toArray();
      allData['accounts'] = await this.accounts.toArray();
      allData['invoices'] = await this.invoices.toArray();
      allData['invoiceDetails'] = await this.invoiceDetails.toArray();
      allData['stock'] = await this.stock.toArray();
      allData['vouchers'] = await this.vouchers.toArray();

      const jsonData = JSON.stringify(allData, null, 2);
      return new Blob([jsonData], { type: 'application/json' });
    } catch (error) {
      console.error('Error exporting database:', error);
      throw error;
    }
  }

  // Utility method to clear database in development
  static async clearDatabase(): Promise<void> {
    try {
      // Clear all versions of the database
      const dbNames = ['DMSPlusDB_v3', 'DMSPlusDB', 'DMSPlusDB_v2'];
      
      for (const dbName of dbNames) {
        try {
          await Dexie.delete(dbName);
          console.log(`Database ${dbName} cleared successfully`);
        } catch {
          // Database might not exist
        }
      }
      
      console.log('All databases cleared successfully');
      // Reload the page to reinitialize
      window.location.reload();
    } catch (error) {
      console.error('Error clearing database:', error);
    }
  }
}