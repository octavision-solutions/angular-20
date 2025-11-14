import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Account, Product } from '../../../../core/models/database.models';
import { DatabaseService } from '../../../../core/services/database.service';

// Interface for display purposes
interface SalesReportItem {
  created_at: Date;
  invoice_no: string;
  acct_id: number;
  product_id: number;
  quantity: number;
  rate: number;
}

@Component({
  selector: 'app-daily-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="feather icon-bar-chart me-2"></i>
                Daily Sales Report
              </h5>
              <div class="d-flex gap-2">
                <input 
                  type="date" 
                  class="form-control" 
                  [(ngModel)]="selectedDate"
                  (change)="loadDailySales()"
                  style="max-width: 200px;">
                <button class="btn btn-primary" (click)="exportToCSV()">
                  <i class="feather icon-download me-1"></i>
                  Export CSV
                </button>
              </div>
            </div>
            <div class="card-body">
              <div class="row mb-4">
                <div class="col-md-3">
                  <div class="card bg-primary text-white">
                    <div class="card-body">
                      <h6>Total Sales</h6>
                      <h4>PKR {{ totalAmount | number:'1.2-2' }}</h4>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card bg-success text-white">
                    <div class="card-body">
                      <h6>Total Transactions</h6>
                      <h4>{{ salesData.length }}</h4>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card bg-info text-white">
                    <div class="card-body">
                      <h6>Items Sold</h6>
                      <h4>{{ totalQuantity | number }}</h4>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card bg-warning text-white">
                    <div class="card-body">
                      <h6>Average Sale</h6>
                      <h4>PKR {{ averageSale | number:'1.2-2' }}</h4>
                    </div>
                  </div>
                </div>
              </div>

              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="salesData.length === 0">
                      <td colspan="7" class="text-center text-muted">
                        No sales found for {{ selectedDate }}
                      </td>
                    </tr>
                    <tr *ngFor="let sale of salesData">
                      <td>{{ sale.created_at | date:'shortTime' }}</td>
                      <td>{{ sale.invoice_no }}</td>
                      <td>{{ getCustomerName(sale.acct_id) }}</td>
                      <td>{{ getProductName(sale.product_id) }}</td>
                      <td>{{ sale.quantity | number }}</td>
                      <td>PKR {{ sale.rate | number:'1.2-2' }}</td>
                      <td>PKR {{ (sale.quantity * sale.rate) | number:'1.2-2' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DailySalesComponent implements OnInit {
  private db = inject(DatabaseService);
  
  salesData: SalesReportItem[] = [];
  products: Product[] = [];
  customers: Account[] = [];
  selectedDate: string = new Date().toISOString().split('T')[0];
  
  get totalAmount(): number {
    return this.salesData.reduce((sum, sale) => sum + (sale.quantity * sale.rate), 0);
  }
  
  get totalQuantity(): number {
    return this.salesData.reduce((sum, sale) => sum + sale.quantity, 0);
  }
  
  get averageSale(): number {
    return this.salesData.length > 0 ? this.totalAmount / this.salesData.length : 0;
  }

  async ngOnInit(): Promise<void> {
    await this.loadReferenceData();
    await this.loadDailySales();
  }

  async loadReferenceData(): Promise<void> {
    try {
      await this.db.initializeDatabase();
      this.products = await this.db.products.toArray();
      this.customers = await this.db.accounts.where('acct_type').equals('customer').toArray();
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  }

  async loadDailySales(): Promise<void> {
    try {
      await this.db.initializeDatabase();
      const startDate = new Date(this.selectedDate);
      const endDate = new Date(this.selectedDate);
      endDate.setDate(endDate.getDate() + 1);
      
      // Load invoices for the day and join with details
      const invoices = await this.db.invoices
        .where('date')
        .between(startDate, endDate, false, true)
        .toArray();
      
      this.salesData = [];
      for (const invoice of invoices) {
        const details = await this.db.invoiceDetails
          .where('invoiceid')
          .equals(invoice.invoiceid!)
          .toArray();
        
        for (const detail of details) {
          this.salesData.push({
            created_at: invoice.created_at || invoice.date,
            invoice_no: `INV-${invoice.invoiceid}`,
            acct_id: invoice.account_id,
            product_id: detail.productid,
            quantity: detail.qty,
            rate: detail.sprice
          });
        }
      }
    } catch (error) {
      console.error('Error loading daily sales:', error);
    }
  }

  getProductName(productId: number): string {
    const product = this.products.find(p => p.productid === productId);
    return product?.product_name || 'Unknown Product';
  }

  getCustomerName(acctId: number): string {
    const customer = this.customers.find(c => c.account_id === acctId);
    return customer?.account_name || 'Walk-in Customer';
  }

  exportToCSV(): void {
    const csvData = this.salesData.map(sale => ({
      Time: new Date(sale.created_at).toLocaleTimeString(),
      'Invoice #': sale.invoice_no,
      Customer: this.getCustomerName(sale.acct_id),
      Product: this.getProductName(sale.product_id),
      Quantity: sale.quantity,
      Rate: sale.rate,
      Amount: sale.quantity * sale.rate
    }));

    const csvContent = this.convertToCSV(csvData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-sales-${this.selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(data: Record<string, unknown>[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }
}