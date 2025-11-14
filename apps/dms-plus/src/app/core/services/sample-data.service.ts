import { Injectable, inject } from '@angular/core';
import Dexie from 'dexie';
import {
  Account,
  Company,
  Invoice,
  InvoiceDetail,
  Product,
  Route,
  Salesman,
  SalesmanRoute,
  Stock,
  Voucher
} from '../models/database.models';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class SampleDataService {

  // Using modern inject() function instead of constructor injection
  private db = inject(DatabaseService);

  async populateSampleData(): Promise<void> {
    try {
      console.log('Starting sample data population...');
      try {
        // Log DB diagnostics before attempting population
        await this.db.logDebugInfo('populateSampleData start');
      } catch (diagErr) {
        console.warn('Unable to collect DB diagnostics before population:', diagErr);
      }
      
      // Ensure database is properly initialized and open
      await this.db.initializeDatabase();
      
      // Wait a bit for database to be fully ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if sample data already exists
      let existingProducts = 0;
      try {
        existingProducts = await this.db.products.count();
      } catch (countError) {
        console.warn('Error checking existing products, will attempt to populate anyway:', countError);
      }
      
      if (existingProducts > 0) {
        console.log(`Sample data already exists (${existingProducts} products), skipping population`);
        return;
      }

      await this.db.transaction('rw', [
        this.db.companies,
        this.db.products,
        this.db.accounts,
        this.db.routes,
        this.db.salesman,
        this.db.salesmanRoutes,
        this.db.stock,
        this.db.invoices,
        this.db.invoiceDetails,
        this.db.vouchers
      ], async () => {
        
        // 1. Add sample companies
        const companies = await this.addSampleCompanies();
        console.log(`Added ${companies.length} companies`);

        // 2. Add sample products
        const products = await this.addSampleProducts(companies);
        console.log(`Added ${products.length} products`);

        // 3. Add sample routes
        const routes = await this.addSampleRoutes();
        console.log(`Added ${routes.length} routes`);

        // 4. Add sample salesman
        const salesmen = await this.addSampleSalesman();
        console.log(`Added ${salesmen.length} salesman`);

        // 5. Assign salesman to routes
        await this.assignSalesmanToRoutes(salesmen, routes);

        // 6. Add sample accounts (customers/suppliers)
        const accounts = await this.addSampleAccounts(routes);
        console.log(`Added ${accounts.length} accounts`);

        // 7. Add sample stock
        await this.addSampleStock(products);
        console.log('Added sample stock');

        // 8. Add sample invoices
        const invoices = await this.addSampleInvoices(salesmen, accounts, routes);
        console.log(`Added ${invoices.length} invoices`);

        // 9. Add invoice details
        await this.addSampleInvoiceDetails(invoices, products);
        console.log('Added sample invoice details');

        // 10. Add sample vouchers
        await this.addSampleVouchers(accounts);
        console.log('Added sample vouchers');
      });

      console.log('Sample data population completed successfully');
    } catch (error) {
      console.error('Error populating sample data:', error);
      try {
        await this.db.logDebugInfo('populateSampleData error');
      } catch (diagErr) {
        console.warn('Unable to collect DB diagnostics after population error:', diagErr);
      }
      
      // If we get a database constraint error, try to recreate the database
      if (error.name === 'ConstraintError' || error.name === 'DatabaseClosedError' || 
          error.message?.includes('index') || error.message?.includes('already exists')) {
        console.log('Database constraint error detected, attempting to recreate database...');
        try {
          await this.recreateDatabase();
          console.log('Database recreated successfully');
        } catch (recreateError) {
          console.error('Failed to recreate database:', recreateError);
          throw new Error('Database recreation failed. Please refresh the page and try again.');
        }
      } else {
        throw error;
      }
    }
  }

  private async recreateDatabase(): Promise<void> {
    try {
      // Close and delete the existing database
      await this.db.close();
      // Use Dexie.delete with the actual database name to ensure proper removal
      await Dexie.delete(this.db.name);
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      
  // Reinitialize the database
  await this.db.initializeDatabase();
      
      // Wait for database to be ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Database recreated, now populating with sample data...');
      
      // Now try to populate sample data again
      await this.populateSampleDataForced();
      
    } catch (error) {
      console.error('Error recreating database:', error);
      throw error;
    }
  }

  private async populateSampleDataForced(): Promise<void> {
    // This method forces sample data population without checking existing data
    await this.db.transaction('rw', [
      this.db.companies,
      this.db.products,
      this.db.accounts,
      this.db.routes,
      this.db.salesman,
      this.db.salesmanRoutes,
      this.db.stock,
      this.db.invoices,
      this.db.invoiceDetails,
      this.db.vouchers
    ], async () => {
      
      // 1. Add sample companies
      const companies = await this.addSampleCompanies();
      console.log(`Added ${companies.length} companies`);

      // 2. Add sample products
      const products = await this.addSampleProducts(companies);
      console.log(`Added ${products.length} products`);

      // 3. Add sample routes
      const routes = await this.addSampleRoutes();
      console.log(`Added ${routes.length} routes`);

      // 4. Add sample salesman
      const salesmen = await this.addSampleSalesman();
      console.log(`Added ${salesmen.length} salesman`);

      // 5. Assign salesman to routes
      await this.assignSalesmanToRoutes(salesmen, routes);

      // 6. Add sample accounts (customers/suppliers)
      const accounts = await this.addSampleAccounts(routes);
      console.log(`Added ${accounts.length} accounts`);

      // 7. Add sample stock
      await this.addSampleStock(products);
      console.log('Added sample stock');

      // 8. Add sample invoices
      const invoices = await this.addSampleInvoices(salesmen, accounts, routes);
      console.log(`Added ${invoices.length} invoices`);

      // 9. Add invoice details
      await this.addSampleInvoiceDetails(invoices, products);
      console.log('Added sample invoice details');

      // 10. Add sample vouchers
      await this.addSampleVouchers(accounts);
      console.log('Added sample vouchers');
    });
  }

  private async addSampleCompanies(): Promise<Company[]> {
    const companies: Omit<Company, 'companyid'>[] = [
      { 
        companyname: 'Unilever Pakistan Limited',
        address: 'Karachi, Pakistan',
        phone: '+92-21-111-253-883'
      },
      { 
        companyname: 'Nestle Pakistan Limited',
        address: 'Lahore, Pakistan',
        phone: '+92-42-111-637-853'
      },
      { 
        companyname: 'Procter & Gamble Pakistan',
        address: 'Islamabad, Pakistan',
        phone: '+92-51-111-746-437'
      },
      { 
        companyname: 'Colgate-Palmolive Pakistan',
        address: 'Karachi, Pakistan',
        phone: '+92-21-111-245-111'
      },
      { 
        companyname: 'Reckitt Benckiser Pakistan',
        address: 'Karachi, Pakistan',
        phone: '+92-21-111-732-548'
      }
    ];

    const inserted: Company[] = [];
    for (const comp of companies) {
      const id = await this.db.companies.put(comp as Company);
      inserted.push({ ...(comp as Company), companyid: id as number });
    }

    return inserted;
  }

  private async addSampleProducts(companies: Company[]): Promise<Product[]> {
    const products: Omit<Product, 'productid'>[] = [
      // Unilever Products
      { companyid: companies[0].companyid!, product_name: 'Surf Excel Washing Powder 1kg', brand: 'Surf Excel', code: 'UNI001', units_in_pack: 12, sprice: 450, unit: 'piece', statusid: 1 },
      { companyid: companies[0].companyid!, product_name: 'Lifebuoy Soap 100g', brand: 'Lifebuoy', code: 'UNI002', units_in_pack: 48, sprice: 85, unit: 'piece', statusid: 1 },
      { companyid: companies[0].companyid!, product_name: 'Lux Beauty Soap 100g', brand: 'Lux', code: 'UNI003', units_in_pack: 48, sprice: 95, unit: 'piece', statusid: 1 },
      { companyid: companies[0].companyid!, product_name: 'Fair & Lovely Cream 50g', brand: 'Fair & Lovely', code: 'UNI004', units_in_pack: 24, sprice: 320, unit: 'piece', statusid: 1 },
      { companyid: companies[0].companyid!, product_name: 'Sunsilk Shampoo 400ml', brand: 'Sunsilk', code: 'UNI005', units_in_pack: 12, sprice: 380, unit: 'piece', statusid: 1 },

      // Nestle Products  
      { companyid: companies[1].companyid!, product_name: 'Nescafe Classic 100g', brand: 'Nescafe', code: 'NES001', units_in_pack: 12, sprice: 850, unit: 'piece', statusid: 1 },
      { companyid: companies[1].companyid!, product_name: 'Kit Kat Chocolate 45g', brand: 'Kit Kat', code: 'NES002', units_in_pack: 24, sprice: 180, unit: 'piece', statusid: 1 },
      { companyid: companies[1].companyid!, product_name: 'Maggi Noodles 77g', brand: 'Maggi', code: 'NES003', units_in_pack: 48, sprice: 65, unit: 'piece', statusid: 1 },
      { companyid: companies[1].companyid!, product_name: 'Nestle Milk Pack 1L', brand: 'Nestle', code: 'NES004', units_in_pack: 12, sprice: 210, unit: 'piece', statusid: 1 },
      { companyid: companies[1].companyid!, product_name: 'Cerelac Baby Food 400g', brand: 'Cerelac', code: 'NES005', units_in_pack: 12, sprice: 950, unit: 'piece', statusid: 1 },

      // P&G Products
      { companyid: companies[2].companyid!, product_name: 'Head & Shoulders Shampoo 400ml', brand: 'Head & Shoulders', code: 'PNG001', units_in_pack: 12, sprice: 680, unit: 'piece', statusid: 1 },
      { companyid: companies[2].companyid!, product_name: 'Pampers Baby Diapers Medium', brand: 'Pampers', code: 'PNG002', units_in_pack: 6, sprice: 2400, unit: 'piece', statusid: 1 },
      { companyid: companies[2].companyid!, product_name: 'Ariel Washing Powder 1kg', brand: 'Ariel', code: 'PNG003', units_in_pack: 12, sprice: 520, unit: 'piece', statusid: 1 },
      { companyid: companies[2].companyid!, product_name: 'Gillette Razor Blue II', brand: 'Gillette', code: 'PNG004', units_in_pack: 24, sprice: 45, unit: 'piece', statusid: 1 },
      { companyid: companies[2].companyid!, product_name: 'Oral-B Toothbrush', brand: 'Oral-B', code: 'PNG005', units_in_pack: 12, sprice: 280, unit: 'piece', statusid: 1 },

      // Colgate Products
      { companyid: companies[3].companyid!, product_name: 'Colgate Total Toothpaste 150g', brand: 'Colgate', code: 'COL001', units_in_pack: 12, sprice: 285, unit: 'piece', statusid: 1 },
      { companyid: companies[3].companyid!, product_name: 'Palmolive Soap 90g', brand: 'Palmolive', code: 'COL002', units_in_pack: 48, sprice: 75, unit: 'piece', statusid: 1 },
      { companyid: companies[3].companyid!, product_name: 'Colgate Toothbrush Medium', brand: 'Colgate', code: 'COL003', units_in_pack: 12, sprice: 150, unit: 'piece', statusid: 1 },

      // Reckitt Products
      { companyid: companies[4].companyid!, product_name: 'Dettol Antiseptic 500ml', brand: 'Dettol', code: 'REC001', units_in_pack: 12, sprice: 420, unit: 'piece', statusid: 1 },
      { companyid: companies[4].companyid!, product_name: 'Harpic Toilet Cleaner 500ml', brand: 'Harpic', code: 'REC002', units_in_pack: 12, sprice: 350, unit: 'piece', statusid: 1 }
    ];

    const inserted: Product[] = [];
    for (const prod of products) {
      const id = await this.db.products.put(prod as Product);
      inserted.push({ ...(prod as Product), productid: id as number });
    }

    return inserted;
  }

  private async addSampleRoutes(): Promise<Route[]> {
    const routes: Omit<Route, 'routeid'>[] = [
      { routename: 'Karachi Central', description: 'Central Karachi area including Saddar, II Chundrigar Road' },
      { routename: 'Karachi North', description: 'North Nazimabad, Gulshan-e-Iqbal, Gulistan-e-Johar' },
      { routename: 'Karachi East', description: 'Defense, Clifton, Korangi areas' },
      { routename: 'Lahore Main', description: 'Main Lahore city, Mall Road, Liberty Market' },
      { routename: 'Lahore Cantt', description: 'Lahore Cantonment and surrounding areas' },
      { routename: 'Islamabad/Rawalpindi', description: 'Twin cities area' },
      { routename: 'Faisalabad', description: 'Faisalabad city and suburbs' },
      { routename: 'Multan', description: 'Multan city area' }
    ];

    const inserted: Route[] = [];
    for (const r of routes) {
      const id = await this.db.routes.put(r as Route);
      inserted.push({ ...(r as Route), routeid: id as number });
    }

    return inserted;
  }

  private async addSampleSalesman(): Promise<Salesman[]> {
    const salesman: Omit<Salesman, 'salesmanid'>[] = [
      { salesmanname: 'Ahmed Khan', address: 'Karachi', mobileno: '+92-300-1234567', login_allowed: true, username: 'ahmed.khan', password: 'salesman123' },
      { salesmanname: 'Muhammad Ali', address: 'Lahore', mobileno: '+92-301-2345678', login_allowed: true, username: 'muhammad.ali', password: 'salesman123' },
      { salesmanname: 'Tariq Mahmood', address: 'Islamabad', mobileno: '+92-302-3456789', login_allowed: true, username: 'tariq.mahmood', password: 'salesman123' },
      { salesmanname: 'Saqib Hassan', address: 'Faisalabad', mobileno: '+92-303-4567890', login_allowed: true, username: 'saqib.hassan', password: 'salesman123' },
      { salesmanname: 'Bilal Ahmed', address: 'Karachi', mobileno: '+92-304-5678901', login_allowed: true, username: 'bilal.ahmed', password: 'salesman123' },
      { salesmanname: 'Imran Shah', address: 'Multan', mobileno: '+92-305-6789012', login_allowed: true, username: 'imran.shah', password: 'salesman123' }
    ];

    const inserted: Salesman[] = [];
    for (const s of salesman) {
      const id = await this.db.salesman.put(s as Salesman);
      inserted.push({ ...(s as Salesman), salesmanid: id as number });
    }

    return inserted;
  }

  private async assignSalesmanToRoutes(salesmen: Salesman[], routes: Route[]): Promise<void> {
    const assignments = [
      { salesmanid: salesmen[0].salesmanid!, routeid: routes[0].routeid!, is_active: true }, // Ahmed Khan -> Karachi Central
      { salesmanid: salesmen[0].salesmanid!, routeid: routes[1].routeid!, is_active: true }, // Ahmed Khan -> Karachi North
      { salesmanid: salesmen[4].salesmanid!, routeid: routes[2].routeid!, is_active: true }, // Bilal Ahmed -> Karachi East
      { salesmanid: salesmen[1].salesmanid!, routeid: routes[3].routeid!, is_active: true }, // Muhammad Ali -> Lahore Main
      { salesmanid: salesmen[1].salesmanid!, routeid: routes[4].routeid!, is_active: true }, // Muhammad Ali -> Lahore Cantt
      { salesmanid: salesmen[2].salesmanid!, routeid: routes[5].routeid!, is_active: true }, // Tariq Mahmood -> Islamabad
      { salesmanid: salesmen[3].salesmanid!, routeid: routes[6].routeid!, is_active: true }, // Saqib Hassan -> Faisalabad
      { salesmanid: salesmen[5].salesmanid!, routeid: routes[7].routeid!, is_active: true }  // Imran Shah -> Multan
    ];

    // Use put to avoid ConstraintError on duplicate composite keys
    for (const asg of assignments) {
      await this.db.salesmanRoutes.put(asg as SalesmanRoute);
    }
  }

  private async addSampleAccounts(routes: Route[]): Promise<Account[]> {
    const accounts: Omit<Account, 'account_id'>[] = [
      // Customers
      { acct_type: 'customer', account_name: 'Al-Madina General Store', address: 'Saddar, Karachi', phone_no1: '+92-21-32456789', city: 'Karachi', routeid: routes[0].routeid!, opening_balance: 0, credit_limit: 100000 },
      { acct_type: 'customer', account_name: 'City Super Market', address: 'Gulshan-e-Iqbal, Karachi', phone_no1: '+92-21-34567890', city: 'Karachi', routeid: routes[1].routeid!, opening_balance: 0, credit_limit: 150000 },
      { acct_type: 'customer', account_name: 'Metro Cash & Carry', address: 'Defense, Karachi', phone_no1: '+92-21-35678901', city: 'Karachi', routeid: routes[2].routeid!, opening_balance: 0, credit_limit: 200000 },
      { acct_type: 'customer', account_name: 'Liberty Market Store', address: 'Liberty, Lahore', phone_no1: '+92-42-37654321', city: 'Lahore', routeid: routes[3].routeid!, opening_balance: 0, credit_limit: 120000 },
      { acct_type: 'customer', account_name: 'Mall Road Traders', address: 'Mall Road, Lahore', phone_no1: '+92-42-37654322', city: 'Lahore', routeid: routes[4].routeid!, opening_balance: 0, credit_limit: 180000 },
      { acct_type: 'customer', account_name: 'Capital Shopping Center', address: 'Blue Area, Islamabad', phone_no1: '+92-51-28765432', city: 'Islamabad', routeid: routes[5].routeid!, opening_balance: 0, credit_limit: 250000 },
      { acct_type: 'customer', account_name: 'Faisalabad Wholesale Market', address: 'Clock Tower, Faisalabad', phone_no1: '+92-41-38765432', city: 'Faisalabad', routeid: routes[6].routeid!, opening_balance: 0, credit_limit: 300000 },
      { acct_type: 'customer', account_name: 'Multan Trading Co.', address: 'Hussain Agahi, Multan', phone_no1: '+92-61-48765432', city: 'Multan', routeid: routes[7].routeid!, opening_balance: 0, credit_limit: 160000 },

      // Suppliers  
      { acct_type: 'supplier', account_name: 'Unilever Distribution', address: 'Karachi', phone_no1: '+92-21-111-253-883', city: 'Karachi', opening_balance: 0 },
      { acct_type: 'supplier', account_name: 'Nestle Distribution', address: 'Lahore', phone_no1: '+92-42-111-637-853', city: 'Lahore', opening_balance: 0 },
      { acct_type: 'supplier', account_name: 'P&G Distribution', address: 'Islamabad', phone_no1: '+92-51-111-746-437', city: 'Islamabad', opening_balance: 0 },

      // Expense accounts
      { acct_type: 'expense', account_name: 'Vehicle Fuel', address: '', city: 'General', opening_balance: 0 },
      { acct_type: 'expense', account_name: 'Vehicle Maintenance', address: '', city: 'General', opening_balance: 0 },
      { acct_type: 'expense', account_name: 'Office Rent', address: '', city: 'General', opening_balance: 0 },
      { acct_type: 'expense', account_name: 'Salaries & Wages', address: '', city: 'General', opening_balance: 0 }
    ];

    const inserted: Account[] = [];
    for (const acc of accounts) {
      const id = await this.db.accounts.put(acc as Account);
      inserted.push({ ...(acc as Account), account_id: id as number });
    }

    return inserted;
  }

  private async addSampleStock(products: Product[]): Promise<void> {
    const stockEntries: Omit<Stock, 'stockid'>[] = [];
    
    // Add stock for each product (simulate receiving stock)
    products.forEach(product => {
      // Add 2-3 different batches per product to simulate FIFO
      for (let batch = 1; batch <= 2; batch++) {
        stockEntries.push({
          productid: product.productid!,
          qty: Math.floor(Math.random() * 100) + 50, // Random qty between 50-150
          pprice: product.sprice * 0.7, // Purchase price is 70% of sale price
          batch_no: `${product.code}B${batch}${new Date().getMonth() + 1}`,
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        });
      }
    });

    // Use put for idempotency
    for (const s of stockEntries) {
      await this.db.stock.put(s as Stock);
    }
  }

  private async addSampleInvoices(salesmen: Salesman[], accounts: Account[], routes: Route[]): Promise<Invoice[]> {
    const customerAccounts = accounts.filter(acc => acc.acct_type === 'customer');
    const invoices: Omit<Invoice, 'invoiceid'>[] = [];

    // Create sample invoices for the last 30 days
    const today = new Date();
    
    for (let day = 0; day < 30; day++) {
      const invoiceDate = new Date(today);
      invoiceDate.setDate(today.getDate() - day);
      
      // Create 1-3 invoices per day
      const invoicesPerDay = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < invoicesPerDay; i++) {
        const randomCustomer = customerAccounts[Math.floor(Math.random() * customerAccounts.length)];
        const route = routes.find(r => r.routeid === randomCustomer.routeid)!;
        const assignedSalesman = salesmen.find(s => s.salesmanname.includes('Ahmed') || s.salesmanname.includes('Ali')); // Pick main salesmen
        
        if (!assignedSalesman) continue;

        const amount = Math.floor(Math.random() * 50000) + 10000; // Random amount 10k-60k
        const discount = amount * 0.05; // 5% discount
        const scheme = 0;
        const tax = (amount - discount) * 0.17; // 17% tax (GST)
        const netAmount = amount - discount + tax;

        invoices.push({
          date: invoiceDate,
          routeid: route.routeid!,
          salesmanid: assignedSalesman.salesmanid!,
          account_id: randomCustomer.account_id!,
          is_cash: Math.random() > 0.7, // 30% cash, 70% credit
          amount,
          discount,
          scheme,
          tax,
          net_amount: netAmount,
          dt_cr: 'sale',
          sync_status: 'synced'
        });
      }
    }

    const inserted: Invoice[] = [];
    for (const inv of invoices) {
      const id = await this.db.invoices.put(inv as Invoice);
      inserted.push({ ...(inv as Invoice), invoiceid: id as number });
    }

    return inserted;
  }

  private async addSampleInvoiceDetails(invoices: Invoice[], products: Product[]): Promise<void> {
    const details: Omit<InvoiceDetail, 'detailid'>[] = [];

    for (const invoice of invoices) {
      // Each invoice has 1-5 products
      const numProducts = Math.floor(Math.random() * 5) + 1;
      const selectedProducts = this.getRandomProducts(products, numProducts);

      let totalAmount = 0;

      for (const product of selectedProducts) {
        const qty = Math.floor(Math.random() * 10) + 1; // 1-10 quantity
        const sprice = product.sprice;
        const pprice = sprice * 0.7; // Cost price
        const lineAmount = qty * sprice;
        const discAge = 0; // No line discount for simplicity
        const lineTotal = lineAmount * (1 - discAge / 100);

        details.push({
          invoiceid: invoice.invoiceid!,
          productid: product.productid!,
          qty,
          sprice,
          pprice,
          disc_age: discAge,
          scheme: 0,
          bonus: 0,
          tax_ratio: 17,
          net_amount: lineTotal
        });

        totalAmount += lineTotal;
      }

      // Update invoice amount to match details (simplified for sample data)
      await this.db.invoices.update(invoice.invoiceid!, {
        amount: totalAmount,
        net_amount: totalAmount * 1.17 // Add 17% tax
      });
    }

    // Insert invoice details using put to avoid duplicate-key failures
    for (const d of details) {
      await this.db.invoiceDetails.put(d as InvoiceDetail);
    }
  }

  private async addSampleVouchers(accounts: Account[]): Promise<void> {
    const customerAccounts = accounts.filter(acc => acc.acct_type === 'customer');
    const expenseAccounts = accounts.filter(acc => acc.acct_type === 'expense');
    const vouchers: Omit<Voucher, 'voucher_id'>[] = [];

    // Add some recovery vouchers
    for (let i = 0; i < 20; i++) {
      const customer = customerAccounts[Math.floor(Math.random() * customerAccounts.length)];
      const amount = Math.floor(Math.random() * 30000) + 5000; // 5k-35k recovery
      
      vouchers.push({
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        account_id: customer.account_id!,
        description: `Cash recovery from ${customer.account_name}`,
        debit: 0,
        credit: amount,
        voucher_type: 'recovery',
        reference_no: `REC${String(i + 1).padStart(4, '0')}`,
        sync_status: 'synced'
      });
    }

    // Add some expense vouchers
    for (let i = 0; i < 15; i++) {
      const expenseAccount = expenseAccounts[Math.floor(Math.random() * expenseAccounts.length)];
      const amount = Math.floor(Math.random() * 10000) + 1000; // 1k-11k expense
      
      vouchers.push({
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        account_id: expenseAccount.account_id!,
        description: `Payment for ${expenseAccount.account_name}`,
        debit: amount,
        credit: 0,
        voucher_type: 'expense',
        reference_no: `EXP${String(i + 1).padStart(4, '0')}`,
        sync_status: 'synced'
      });
    }

    for (const v of vouchers) {
      await this.db.vouchers.put(v as Voucher);
    }
  }

  private getRandomProducts(products: Product[], count: number): Product[] {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}