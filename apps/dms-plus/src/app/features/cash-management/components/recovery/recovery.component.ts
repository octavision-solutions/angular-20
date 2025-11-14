import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Account, Route as DbRoute } from '../../../../core/models/database.models';
import { AuthService } from '../../../../core/services/auth.service';
import { DatabaseService } from '../../../../core/services/database.service';

interface OutstandingInvoice {
  invoiceid: number;
  date: Date;
  customer_id: number;
  customer_name: string;
  total_amount: number;
  outstanding_amount: number;
  selected: boolean;
}

interface CustomerWithBalance extends Account {
  outstanding_balance: number;
}

interface TodayCollections {
  amount: number;
  count: number;
}

@Component({
  selector: 'app-recovery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recovery.component.html',
  styleUrls: ['./recovery.component.scss']
})
export class RecoveryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private db = inject(DatabaseService);
  private authService = inject(AuthService);

  // Forms
  filterForm!: FormGroup;
  paymentForm!: FormGroup;

  // Data arrays
  routes: DbRoute[] = [];
  customers: CustomerWithBalance[] = [];
  filteredCustomers: CustomerWithBalance[] = [];
  outstandingInvoices: OutstandingInvoice[] = [];

  // State
  isLoading = false;
  isProcessing = false;
  showSuccessMessage = false;
  errorMessage = '';
  today = new Date().toISOString().split('T')[0];

  // Summary data
  todayCollections: TodayCollections = { amount: 0, count: 0 };
  selectedCustomer: CustomerWithBalance | null = null;

  ngOnInit(): void {
    this.initializeForms();
    this.loadInitialData();
  }

  private initializeForms(): void {
    this.filterForm = this.fb.group({
      routeId: [''],
      customerId: [''],
      filterDate: [this.today]
    });

    this.paymentForm = this.fb.group({
      paymentMethod: ['cash', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      reference: [''],
      notes: ['']
    });

    // Update reference validation based on payment method
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      const referenceControl = this.paymentForm.get('reference');
      if (method === 'cash') {
        referenceControl?.clearValidators();
      } else {
        referenceControl?.setValidators([Validators.required]);
      }
      referenceControl?.updateValueAndValidity();
    });
  }

  private async loadInitialData(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Load routes and customers
      await Promise.all([
        this.loadRoutes(),
        this.loadCustomers(),
        this.loadTodayCollections()
      ]);

      // Load initial outstanding invoices
      await this.loadOutstandingInvoices();
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.errorMessage = 'Failed to load data. Please refresh the page.';
    } finally {
      this.isLoading = false;
    }
  }

  private async loadRoutes(): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && currentUser.routes.length > 0) {
        // Load only user's assigned routes
        this.routes = await this.db.routes
          .where('routeid')
          .anyOf(currentUser.routes)
          .toArray();
      } else {
        // Load all routes for admin
        this.routes = await this.db.routes.toArray();
      }
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  }

  private async loadCustomers(): Promise<void> {
    try {
      // Load customers with outstanding balances
      const customers = await this.db.accounts
        .where('acct_type')
        .equals('customer')
        .toArray();

      // Calculate outstanding balance for each customer
      this.customers = [];
      for (const customer of customers) {
        const outstanding_balance = await this.calculateCustomerOutstanding(customer.account_id!);
        this.customers.push({
          ...customer,
          outstanding_balance
        });
      }

      this.filteredCustomers = [...this.customers];
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }

  private async calculateCustomerOutstanding(customerId: number): Promise<number> {
    try {
      // Get all invoices for this customer
      const invoices = await this.db.invoices
        .where('account_id')
        .equals(customerId)
        .toArray();

      // Calculate total invoice amount using net_amount
      let totalInvoiced = 0;
      for (const invoice of invoices) {
        totalInvoiced += invoice.net_amount || 0;
      }

      // Get all payments for this customer (from vouchers using credit amount)
      const payments = await this.db.vouchers
        .where('account_id')
        .equals(customerId)
        .and(voucher => voucher.voucher_type === 'receipt')
        .toArray();

      const totalPaid = payments.reduce((sum, payment) => sum + (payment.credit || 0), 0);

      return totalInvoiced - totalPaid;
    } catch (error) {
      console.error('Error calculating outstanding:', error);
      return 0;
    }
  }

  private async loadTodayCollections(): Promise<void> {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todayPayments = await this.db.vouchers
        .where('date')
        .between(startOfDay, endOfDay)
        .and(voucher => voucher.voucher_type === 'receipt')
        .toArray();

      this.todayCollections = {
        amount: todayPayments.reduce((sum, payment) => sum + (payment.credit || 0), 0),
        count: todayPayments.length
      };
    } catch (error) {
      console.error('Error loading today collections:', error);
    }
  }

  async onRouteChange(): Promise<void> {
    const routeId = this.filterForm.get('routeId')?.value;
    
    if (routeId) {
      this.filteredCustomers = this.customers.filter(c => c.routeid === parseInt(routeId));
    } else {
      this.filteredCustomers = [...this.customers];
    }

    // Reset customer selection
    this.filterForm.get('customerId')?.setValue('');
    this.selectedCustomer = null;
    
    await this.loadOutstandingInvoices();
  }

  async onCustomerChange(): Promise<void> {
    const customerId = this.filterForm.get('customerId')?.value;
    
    if (customerId) {
      this.selectedCustomer = this.customers.find(c => c.account_id === parseInt(customerId)) || null;
    } else {
      this.selectedCustomer = null;
    }

    await this.loadOutstandingInvoices();
  }

  async loadOutstandingInvoices(): Promise<void> {
    try {
      this.isLoading = true;
      const routeId = this.filterForm.get('routeId')?.value;
      const customerId = this.filterForm.get('customerId')?.value;

      const query = this.db.invoices.orderBy('date');

      // Apply filters
      let invoices = await query.toArray();

      if (routeId) {
        invoices = invoices.filter(invoice => invoice.routeid === parseInt(routeId));
      }

      if (customerId) {
        invoices = invoices.filter(invoice => invoice.account_id === parseInt(customerId));
      }

      // Calculate outstanding amounts and filter only those with outstanding
      this.outstandingInvoices = [];
      
      for (const invoice of invoices) {
        const outstandingAmount = await this.calculateInvoiceOutstanding(invoice.invoiceid!);
        
        if (outstandingAmount > 0) {
          const customer = this.customers.find(c => c.account_id === invoice.account_id);
          
          this.outstandingInvoices.push({
            invoiceid: invoice.invoiceid!,
            date: new Date(invoice.date),
            customer_id: invoice.account_id,
            customer_name: customer?.account_name || 'Unknown Customer',
            total_amount: invoice.net_amount || 0,
            outstanding_amount: outstandingAmount,
            selected: false
          });
        }
      }

      // Sort by date (oldest first)
      this.outstandingInvoices.sort((a, b) => a.date.getTime() - b.date.getTime());

    } catch (error) {
      console.error('Error loading outstanding invoices:', error);
      this.errorMessage = 'Failed to load outstanding invoices.';
    } finally {
      this.isLoading = false;
    }
  }

  private async calculateInvoiceOutstanding(invoiceId: number): Promise<number> {
    try {
      // Get invoice total
      const invoice = await this.db.invoices.get(invoiceId);
      if (!invoice) return 0;

      const invoiceTotal = invoice.net_amount || 0;

      // Get payments against this invoice (simplified - using invoice date for matching)
      // In a real system, you'd have a proper invoice-payment mapping table
      const payments = await this.db.vouchers
        .where('account_id')
        .equals(invoice.account_id)
        .and(voucher => 
          voucher.voucher_type === 'receipt' && 
          new Date(voucher.date) >= new Date(invoice.date)
        )
        .toArray();

      // For this simplified version, we'll assume payments are applied FIFO
      let remainingAmount = invoiceTotal;

      // This is a simplified calculation - in production you'd have proper payment allocation
      const customerPayments = payments.reduce((sum, payment) => sum + (payment.credit || 0), 0);
      const customerInvoices = await this.db.invoices
        .where('account_id')
        .equals(invoice.account_id)
        .and(inv => new Date(inv.date) <= new Date(invoice.date))
        .toArray();

      const totalInvoicesBeforeThis = customerInvoices
        .filter(inv => new Date(inv.date) < new Date(invoice.date))
        .reduce((sum, inv) => sum + (inv.net_amount || 0), 0);

      const appliedPayments = Math.max(0, customerPayments - totalInvoicesBeforeThis);
      remainingAmount = Math.max(0, invoiceTotal - appliedPayments);

      return remainingAmount;

    } catch (error) {
      console.error('Error calculating invoice outstanding:', error);
      return 0;
    }
  }

  getDaysOutstanding(invoiceDate: Date): number {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - invoiceDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  toggleInvoiceSelection(invoice: OutstandingInvoice): void {
    invoice.selected = !invoice.selected;
    this.updatePaymentAmount();
  }

  toggleAllInvoices(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.outstandingInvoices.forEach(invoice => {
      invoice.selected = target.checked;
    });
    this.updatePaymentAmount();
  }

  get allInvoicesSelected(): boolean {
    return this.outstandingInvoices.length > 0 && 
           this.outstandingInvoices.every(invoice => invoice.selected);
  }

  private updatePaymentAmount(): void {
    const totalOutstanding = this.getTotalOutstandingAmount();
    this.paymentForm.get('amount')?.setValue(totalOutstanding);
  }

  getTotalSelectedAmount(): number {
    return this.outstandingInvoices
      .filter(invoice => invoice.selected)
      .reduce((total, invoice) => total + invoice.total_amount, 0);
  }

  getTotalOutstandingAmount(): number {
    return this.outstandingInvoices
      .filter(invoice => invoice.selected)
      .reduce((total, invoice) => total + invoice.outstanding_amount, 0);
  }

  getReferenceLabel(): string {
    const method = this.paymentForm.get('paymentMethod')?.value;
    switch (method) {
      case 'cheque': return 'Enter cheque number';
      case 'bank_transfer': return 'Enter transaction reference';
      case 'online': return 'Enter transaction ID';
      default: return 'Enter reference number';
    }
  }

  async collectPayment(): Promise<void> {
    if (!this.paymentForm.valid) return;

    const selectedInvoices = this.outstandingInvoices.filter(inv => inv.selected);
    if (selectedInvoices.length === 0) {
      this.errorMessage = 'Please select at least one invoice.';
      return;
    }

    if (!this.selectedCustomer) {
      this.errorMessage = 'Please select a customer.';
      return;
    }

    try {
      this.isProcessing = true;

      const formData = this.paymentForm.value;

      // Create voucher record
      const voucherId = await this.db.vouchers.add({
        date: new Date(),
        account_id: this.selectedCustomer.account_id!,
        voucher_type: 'receipt',
        credit: parseFloat(formData.amount),
        debit: 0,
        description: formData.notes || `Payment collection for ${selectedInvoices.length} invoice(s)`,
        reference_no: formData.reference || null,
        sync_status: 'pending'
      });

      // Add to sync queue
      await this.db.addToSyncQueue('vouchers', voucherId, 'insert', {
        voucher_id: voucherId,
        account_id: this.selectedCustomer.account_id!,
        amount: parseFloat(formData.amount),
        payment_method: formData.paymentMethod
      });

      // Update today's collections
      await this.loadTodayCollections();

      // Refresh outstanding invoices
      await this.loadOutstandingInvoices();

      // Clear forms and show success
      this.clearPaymentForm();
      this.showSuccessMessage = true;
      
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 5000);

    } catch (error) {
      console.error('Error collecting payment:', error);
      this.errorMessage = 'Failed to record payment. Please try again.';
    } finally {
      this.isProcessing = false;
    }
  }

  clearPaymentForm(): void {
    this.paymentForm.patchValue({
      paymentMethod: 'cash',
      amount: '',
      reference: '',
      notes: ''
    });

    // Unselect all invoices
    this.outstandingInvoices.forEach(invoice => {
      invoice.selected = false;
    });
  }

  async refreshData(): Promise<void> {
    await this.loadInitialData();
  }

  showSummaryModal(): void {
    // This could open a modal with detailed recovery summary
    // For now, we'll just show an alert with today's summary
    const message = `Today's Recovery Summary:
    
Total Amount: ₨${this.todayCollections.amount.toLocaleString()}
Total Payments: ${this.todayCollections.count}
Outstanding Invoices: ${this.outstandingInvoices.length}
Total Outstanding: ₨${this.outstandingInvoices.reduce((sum, inv) => sum + inv.outstanding_amount, 0).toLocaleString()}`;

    alert(message);
  }
}