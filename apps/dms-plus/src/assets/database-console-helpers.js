// Database Console Helper Functions
// Copy this code and paste it into your browser console when the app is running

// Get all data from a specific table
async function getTableData(tableName) {
  const db = window.dmsDatabase || await getDatabaseInstance();
  if (db && db[tableName]) {
    return await db[tableName].toArray();
  }
  console.error(`Table ${tableName} not found`);
  return [];
}

// Get table count
async function getTableCount(tableName) {
  const db = window.dmsDatabase || await getDatabaseInstance();
  if (db && db[tableName]) {
    return await db[tableName].count();
  }
  console.error(`Table ${tableName} not found`);
  return 0;
}

// List all tables with counts
async function listAllTables() {
  const tables = [
    'products', 'companies', 'salesman', 'routes', 'salesmanRoutes',
    'accounts', 'stock', 'invoices', 'invoiceDetails', 'purchaseInvoices',
    'purchaseInvoiceDetails', 'vouchers', 'syncQueue', 'appConfig'
  ];
  
  const result = {};
  for (const table of tables) {
    try {
      result[table] = await getTableCount(table);
    } catch (error) {
      result[table] = 'Error: ' + error.message;
    }
  }
  
  console.table(result);
  return result;
}

// Clear a specific table
async function clearTable(tableName) {
  const db = window.dmsDatabase || await getDatabaseInstance();
  if (db && db[tableName]) {
    await db[tableName].clear();
    console.log(`Cleared table: ${tableName}`);
  } else {
    console.error(`Table ${tableName} not found`);
  }
}

// Export table data as JSON
async function exportTableAsJSON(tableName) {
  const data = await getTableData(tableName);
  const jsonString = JSON.stringify(data, null, 2);
  
  // Create download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${tableName}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return data;
}

// Get database instance
async function getDatabaseInstance() {
  try {
    // This assumes the DatabaseService is available globally
    const appComponent = document.querySelector('app-root');
    if (appComponent && appComponent.__ngContext__) {
      const injector = appComponent.__ngContext__[0];
      const dbService = injector.get('DatabaseService');
      await dbService.initializeDatabase();
      return dbService;
    }
    console.error('Could not get database instance');
    return null;
  } catch (error) {
    console.error('Error getting database instance:', error);
    return null;
  }
}

// Usage Examples:
console.log(`
🔍 Database Console Helper Functions Loaded!

Examples:
1. List all tables:           await listAllTables()
2. Get products data:         await getTableData('products')
3. Get product count:         await getTableCount('products')
4. Clear invoices table:      await clearTable('invoices')
5. Export products as JSON:   await exportTableAsJSON('products')

Available tables:
- products, companies, salesman, routes, salesmanRoutes
- accounts, stock, invoices, invoiceDetails
- purchaseInvoices, purchaseInvoiceDetails
- vouchers, syncQueue, appConfig
`);