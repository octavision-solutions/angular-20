import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Product, Stock } from '../../../../core/models/database.models';
import { DatabaseService } from '../../../../core/services/database.service';

interface StockBalance {
  productid: number;
  product_name: string;
  code: string;
  total_qty: number;
  avg_cost: number;
  total_value: number;
}

@Component({
  selector: 'app-stock-balance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="feather icon-layers me-2"></i>
                Stock Balance
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Product Name</th>
                      <th>Quantity</th>
                      <th>Avg Cost</th>
                      <th>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="stockBalance.length === 0">
                      <td colspan="5" class="text-center text-muted">No stock data found</td>
                    </tr>
                    <tr *ngFor="let item of stockBalance">
                      <td>{{ item.code }}</td>
                      <td>{{ item.product_name }}</td>
                      <td>{{ item.total_qty }}</td>
                      <td>PKR {{ item.avg_cost | number:'1.2-2' }}</td>
                      <td>PKR {{ item.total_value | number:'1.2-2' }}</td>
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
export class StockBalanceComponent implements OnInit {
  private db = inject(DatabaseService);
  
  stockBalance: StockBalance[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadStockBalance();
  }

  async loadStockBalance(): Promise<void> {
    try {
      await this.db.initializeDatabase();
      const [products, stocks] = await Promise.all([
        this.db.products.toArray(),
        this.db.stock.toArray()
      ]);

      this.stockBalance = await this.calculateStockBalance(products, stocks);
    } catch (error) {
      console.error('Error loading stock balance:', error);
    }
  }

  private async calculateStockBalance(products: Product[], stocks: Stock[]): Promise<StockBalance[]> {
    const balance: StockBalance[] = [];
    
    for (const product of products) {
      const productStocks = stocks.filter(s => s.productid === product.productid);
      const totalQty = productStocks.reduce((sum, s) => sum + s.qty, 0);
      const totalValue = productStocks.reduce((sum, s) => sum + (s.qty * s.pprice), 0);
      const avgCost = totalQty > 0 ? totalValue / totalQty : 0;

      if (totalQty > 0) {
        balance.push({
          productid: product.productid!,
          product_name: product.product_name,
          code: product.code || '',
          total_qty: totalQty,
          avg_cost: avgCost,
          total_value: totalValue
        });
      }
    }

    return balance;
  }
}