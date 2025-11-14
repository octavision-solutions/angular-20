import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../../../core/services/database.service';
import { SampleDataService } from '../../../../core/services/sample-data.service';

interface TableInfo {
  name: string;
  count: number;
  data: Record<string, unknown>[];
  expanded: boolean;
}

@Component({
  selector: 'app-database-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="feather icon-database me-2"></i>
                Database Viewer
              </h5>
              <div class="d-flex gap-2 mt-2">
                <button class="btn btn-primary btn-sm" (click)="loadAllTables()">
                  <i class="feather icon-refresh-cw me-1"></i>
                  Refresh All
                </button>
                <button class="btn btn-success btn-sm" (click)="populateSampleData()">
                  <i class="feather icon-plus me-1"></i>
                  Add Sample Data
                </button>
                <button class="btn btn-danger btn-sm" (click)="clearAllData()">
                  <i class="feather icon-trash-2 me-1"></i>
                  Clear All Data
                </button>
              </div>
            </div>
            <div class="card-body">
              <div *ngIf="isLoading" class="text-center py-4">
                <div class="spinner-border" role="status">
                  <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2">Loading database tables...</p>
              </div>
              
              <div *ngIf="!isLoading && tables.length === 0" class="text-center py-4">
                <i class="feather icon-database" style="font-size: 3rem; color: #ccc;"></i>
                <h6 class="mt-3 text-muted">No data found</h6>
                <p class="text-muted">Click "Add Sample Data" to populate the database with test data.</p>
              </div>
              <div class="table-responsive">
                <div *ngFor="let table of tables" class="mb-4">
                  <div class="card">
                    <div class="card-header bg-light cursor-pointer" 
                         (click)="toggleTable(table)">
                      <h6 class="mb-0 d-flex justify-content-between align-items-center">
                        <span>
                          <i class="feather" 
                             [class.icon-chevron-down]="table.expanded"
                             [class.icon-chevron-right]="!table.expanded"></i>
                          {{ table.name }} 
                          <span class="badge badge-info ms-2">{{ table.count }} records</span>
                        </span>
                        <div class="btn-group" (click)="$event.stopPropagation()">
                          <button class="btn btn-sm btn-outline-primary" 
                                  (click)="loadTableData(table)">
                            <i class="feather icon-refresh-cw"></i>
                          </button>
                          <button class="btn btn-sm btn-outline-success" 
                                  (click)="exportTableData(table)">
                            <i class="feather icon-download"></i>
                          </button>
                          <button class="btn btn-sm btn-outline-danger" 
                                  (click)="clearTableData(table)">
                            <i class="feather icon-trash-2"></i>
                          </button>
                        </div>
                      </h6>
                    </div>
                    <div class="card-body" *ngIf="table.expanded">
                      <div *ngIf="table.data.length === 0" class="text-muted text-center py-3">
                        No data found in this table
                      </div>
                      <div *ngIf="table.data.length > 0">
                        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                          <table class="table table-sm table-striped">
                            <thead class="thead-dark sticky-top">
                              <tr>
                                <th *ngFor="let key of getTableColumns(table.data[0])" 
                                    class="text-nowrap">
                                  {{ key }}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr *ngFor="let row of table.data; let i = index">
                                <td *ngFor="let key of getTableColumns(table.data[0])" 
                                    class="text-nowrap small">
                                  <span [title]="formatCellValue(row[key])">
                                    {{ formatCellValue(row[key]) | slice:0:100 }}
                                    <span *ngIf="formatCellValue(row[key]).length > 100">...</span>
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cursor-pointer {
      cursor: pointer;
    }
    .table th {
      background-color: #f8f9fa;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .card-header {
      transition: background-color 0.2s;
    }
    .card-header:hover {
      background-color: #e9ecef !important;
    }
  `]
})
export class DatabaseViewerComponent implements OnInit {
  private db = inject(DatabaseService);
  private sampleDataService = inject(SampleDataService);
  
  tables: TableInfo[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.loadAllTables();
  }

  async loadAllTables(): Promise<void> {
    this.isLoading = true;
    try {
      // Ensure database is properly initialized
      await this.db.initializeDatabase();
      
      // Wait a bit for database to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // List of all available tables in the database
      const tableConfigs = [
        { name: 'products', table: this.db.products },
        { name: 'companies', table: this.db.companies },
        { name: 'salesman', table: this.db.salesman },
        { name: 'routes', table: this.db.routes },
        { name: 'salesmanRoutes', table: this.db.salesmanRoutes },
        { name: 'accounts', table: this.db.accounts },
        { name: 'stock', table: this.db.stock },
        { name: 'invoices', table: this.db.invoices },
        { name: 'invoiceDetails', table: this.db.invoiceDetails },
        { name: 'purchaseInvoices', table: this.db.purchaseInvoices },
        { name: 'purchaseInvoiceDetails', table: this.db.purchaseInvoiceDetails },
        { name: 'vouchers', table: this.db.vouchers },
        { name: 'syncQueue', table: this.db.syncQueue },
        { name: 'appConfig', table: this.db.appConfig }
      ];

      this.tables = [];
      
      for (const config of tableConfigs) {
        try {
          if (config.table && config.table.count) {
            // Test database connectivity
            const count = await config.table.count();
            this.tables.push({
              name: config.name,
              count,
              data: [],
              expanded: false
            });
          }
        } catch (tableError) {
          console.warn(`Could not access table ${config.name}:`, tableError);
          
          // If we get database errors, the database might be in a bad state
          if (tableError instanceof Error && (tableError.name === 'DatabaseClosedError' || tableError.name === 'ConstraintError')) {
            console.log('Database connectivity issues detected');
            throw new Error('Database connectivity issues. Please refresh the page.');
          }
        }
      }
      
      // Sort by record count (descending)
      this.tables.sort((a, b) => b.count - a.count);
      
    } catch (error) {
      console.error('Error loading tables:', error);
      
      // If we get database errors, show user-friendly message
      if (error instanceof Error && error.message?.includes('Database connectivity')) {
        alert('Database connectivity issues detected. Please refresh the page to reset the database.');
      }
    } finally {
      this.isLoading = false;
    }
  }

  async populateSampleData(): Promise<void> {
    if (confirm('This will add sample data to your database. Continue?')) {
      this.isLoading = true;
      try {
        await this.sampleDataService.populateSampleData();
        console.log('Sample data populated successfully');
        await this.loadAllTables(); // Refresh the view
        alert('Sample data added successfully!');
      } catch (error) {
        console.error('Error populating sample data:', error);
        
        // Check if it's a database constraint error
        if ((error as any)?.name === 'ConstraintError' || (error as any)?.name === 'DatabaseClosedError' || 
            (error as any)?.message?.includes('index') || (error as any)?.message?.includes('already exists')) {
          const shouldRecreate = confirm(
            'Database schema conflict detected. Would you like to recreate the database with fresh data? ' +
            '(This will clear all existing data)'
          );
          
          if (shouldRecreate) {
            try {
              // Clear all data first
              await this.clearAllDataSilent();
              // Try to populate sample data again
              await this.sampleDataService.populateSampleData();
              console.log('Database recreated and sample data populated successfully');
              await this.loadAllTables();
              alert('Database recreated with sample data successfully!');
            } catch (recreateError) {
              console.error('Error recreating database:', recreateError);
              alert('Failed to recreate database. Please refresh the page and try again.');
            }
          }
        } else {
          alert('Failed to populate sample data. Check console for details.');
        }
      } finally {
        this.isLoading = false;
      }
    }
  }

  private async clearAllDataSilent(): Promise<void> {
    // Clear database without confirmation dialogs
    await this.db.close();
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.db.delete();
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.db.initializeDatabase();
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  async toggleTable(table: TableInfo): Promise<void> {
    table.expanded = !table.expanded;
    
    if (table.expanded && table.data.length === 0) {
      await this.loadTableData(table);
    }
  }

  async loadTableData(table: TableInfo): Promise<void> {
    try {
      let dbTable;
      switch (table.name) {
        case 'products': dbTable = this.db.products; break;
        case 'companies': dbTable = this.db.companies; break;
        case 'salesman': dbTable = this.db.salesman; break;
        case 'routes': dbTable = this.db.routes; break;
        case 'salesmanRoutes': dbTable = this.db.salesmanRoutes; break;
        case 'accounts': dbTable = this.db.accounts; break;
        case 'stock': dbTable = this.db.stock; break;
        case 'invoices': dbTable = this.db.invoices; break;
        case 'invoiceDetails': dbTable = this.db.invoiceDetails; break;
        case 'purchaseInvoices': dbTable = this.db.purchaseInvoices; break;
        case 'purchaseInvoiceDetails': dbTable = this.db.purchaseInvoiceDetails; break;
        case 'vouchers': dbTable = this.db.vouchers; break;
        case 'syncQueue': dbTable = this.db.syncQueue; break;
        case 'appConfig': dbTable = this.db.appConfig; break;
      }
      
      if (dbTable) {
        table.data = await dbTable.limit(1000).toArray() as unknown as Record<string, unknown>[];
        table.count = await dbTable.count();
      }
    } catch (error) {
      console.error(`Error loading data for table ${table.name}:`, error);
    }
  }

  async clearTableData(table: TableInfo): Promise<void> {
    if (confirm(`Are you sure you want to clear all data from ${table.name}? This action cannot be undone.`)) {
      try {
        let dbTable;
        switch (table.name) {
          case 'products': dbTable = this.db.products; break;
          case 'companies': dbTable = this.db.companies; break;
          case 'salesman': dbTable = this.db.salesman; break;
          case 'routes': dbTable = this.db.routes; break;
          case 'salesmanRoutes': dbTable = this.db.salesmanRoutes; break;
          case 'accounts': dbTable = this.db.accounts; break;
          case 'stock': dbTable = this.db.stock; break;
          case 'invoices': dbTable = this.db.invoices; break;
          case 'invoiceDetails': dbTable = this.db.invoiceDetails; break;
          case 'purchaseInvoices': dbTable = this.db.purchaseInvoices; break;
          case 'purchaseInvoiceDetails': dbTable = this.db.purchaseInvoiceDetails; break;
          case 'vouchers': dbTable = this.db.vouchers; break;
          case 'syncQueue': dbTable = this.db.syncQueue; break;
          case 'appConfig': dbTable = this.db.appConfig; break;
        }
        
        if (dbTable) {
          await dbTable.clear();
          table.data = [];
          table.count = 0;
          console.log(`Cleared all data from ${table.name}`);
        }
      } catch (error) {
        console.error(`Error clearing table ${table.name}:`, error);
      }
    }
  }

  async clearAllData(): Promise<void> {
    if (confirm('Are you sure you want to clear ALL database data? This action cannot be undone.')) {
      try {
        this.isLoading = true;
        
        // Close the database first
        await this.db.close();
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Delete the database
        await this.db.delete();
        
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('Database cleared successfully');
        
        // Reinitialize the database
        await this.db.initializeDatabase();
        
        // Wait for database to be ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Refresh the view
        await this.loadAllTables();
        
      } catch (error) {
        console.error('Error clearing database:', error);
        alert('Error clearing database. Please refresh the page and try again.');
      } finally {
        this.isLoading = false;
      }
    }
  }

  exportTableData(table: TableInfo): void {
    if (table.data.length === 0) {
      alert('No data to export');
      return;
    }

    const csv = this.convertToCSV(table.data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${table.name}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  getTableColumns(row: Record<string, unknown>): string[] {
    return row ? Object.keys(row) : [];
  }

  formatCellValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private convertToCSV(data: Record<string, unknown>[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => {
        const stringValue = this.formatCellValue(value);
        // Escape quotes and wrap in quotes if contains comma or quote
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }
}