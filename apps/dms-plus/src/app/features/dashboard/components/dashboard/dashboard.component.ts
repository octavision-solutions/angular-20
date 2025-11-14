import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Invoice } from '../../../../core/models/database.models';
import { AuthService, AuthUser } from '../../../../core/services/auth.service';
import { DatabaseService } from '../../../../core/services/database.service';

interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  todaySales: number;
  pendingRecovery: number;
  stockAlerts: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalProducts: 0,
    totalCustomers: 0,
    todaySales: 0,
    pendingRecovery: 0,
    stockAlerts: 0
  };

  currentUser: AuthUser | null = null;
  isLoading = true;
  recentInvoices: Invoice[] = [];

  // Using modern inject() function instead of constructor injection
  private db = inject(DatabaseService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  private async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Load statistics
      await Promise.all([
        this.loadStats(),
        this.loadRecentInvoices()
      ]);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadStats(): Promise<void> {
    try {
      // Get total products
      this.stats.totalProducts = await (this.db as any).products
        .where('statusid')
        .equals(1)
        .count();

      // Get total customers
      this.stats.totalCustomers = await (this.db as any).accounts
        .where('acct_type')
        .equals('customer')
        .count();

      // Get today's sales (simplified - actual implementation would use date range)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      interface InvoiceFilter {
        dt_cr: string;
      }

      const todayInvoices: Invoice[] = await (this.db as any).invoices
        .where('date')
        .aboveOrEqual(today)
        .and((inv: InvoiceFilter) => inv.dt_cr === 'sale')
        .toArray();

      this.stats.todaySales = todayInvoices.reduce((sum: any, inv: { net_amount: any; }) => sum + inv.net_amount, 0);

      // Get pending recovery (simplified)
      this.stats.pendingRecovery = 25000; // Placeholder

      // Get stock alerts (products with low stock)
      const lowStockProducts = await (this.db as any).products
        .where('shortstock')
        .above(0)
        .count();
      
      this.stats.stockAlerts = lowStockProducts;

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  private async loadRecentInvoices(): Promise<void> {
    try {
      this.recentInvoices = await (this.db as any).invoices
        .orderBy('date')
        .reverse()
        .limit(5)
        .toArray();
    } catch (error) {
      console.error('Error loading recent invoices:', error);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}