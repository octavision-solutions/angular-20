import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Account } from '../../../../core/models/database.models';
import { AuthService } from '../../../../core/services/auth.service';
import { DatabaseService } from '../../../../core/services/database.service';

interface CashPaymentData {
  voucher_id?: number;
  date: Date;
  account_id: number;
  account_name: string;
  payment_type: string;
  payment_method: string;
  debit: number;
  description: string;
  reference_no?: string;
  notes?: string;
}

interface TodaySummary {
  total: number;
  count: number;
  largest: number;
  average: number;
}

@Component({
  selector: 'app-cash-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cash-payment.component.html',
  styleUrls: ['./cash-payment.component.scss']
})
export class CashPaymentComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private db = inject(DatabaseService);
  private authService = inject(AuthService);

  // Form
  paymentForm!: FormGroup;

  // Data arrays
  supplierAccounts: Account[] = [];
  expenseAccounts: Account[] = [];
  liabilityAccounts: Account[] = [];
  recentPayments: CashPaymentData[] = [];

  // State
  isLoading = false;
  isProcessing = false;
  showSuccessMessage = false;
  showHighlight = false;
  successMessage = '';
  errorMessage = '';
  today = new Date().toISOString().split('T')[0];

  // Summary data
  todaySummary: TodaySummary = { total: 0, count: 0, largest: 0, average: 0 };
  selectedPayment: CashPaymentData | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
  }

  private initializeForm(): void {
    this.paymentForm = this.fb.group({
      date: [this.today, Validators.required],
      accountId: ['', Validators.required],
      paymentType: ['', Validators.required],
      paymentMethod: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      referenceNo: [''],
      description: ['', Validators.required],
      notes: ['']
    });
  }

  private async loadInitialData(): Promise<void> {
    try {
      this.isLoading = true;
      
      await Promise.all([
        this.loadAccounts(),
        this.loadRecentPayments(),
        this.calculateTodaySummary()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.errorMessage = 'Failed to load data. Please refresh the page.';
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAccounts(): Promise<void> {
    try {
      const allAccounts = await this.db.accounts.toArray();
      
      this.supplierAccounts = allAccounts.filter(acc => acc.acct_type === 'supplier');
      this.expenseAccounts = allAccounts.filter(acc => acc.acct_type === 'expense');
      this.liabilityAccounts = allAccounts.filter(acc => acc.acct_type === 'liability');

      // Add default accounts if they don't exist
      if (this.expenseAccounts.length === 0) {
        await this.createDefaultExpenseAccounts();
        this.expenseAccounts = await this.db.accounts
          .where('acct_type')
          .equals('expense')
          .toArray();
      }

      if (this.liabilityAccounts.length === 0) {
        await this.createDefaultLiabilityAccounts();
        this.liabilityAccounts = await this.db.accounts
          .where('acct_type')
          .equals('liability')
          .toArray();
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  }

  private async createDefaultExpenseAccounts(): Promise<void> {
    const defaultExpenseAccounts: Partial<Account>[] = [
      { acct_type: 'expense', account_name: 'Office Rent - دفتری کرایہ' },
      { acct_type: 'expense', account_name: 'Utilities - بجلی/گیس/پانی' },
      { acct_type: 'expense', account_name: 'Transportation - نقل و حمل' },
      { acct_type: 'expense', account_name: 'Office Supplies - دفتری سامان' },
      { acct_type: 'expense', account_name: 'Telephone & Internet - فون/انٹرنیٹ' },
      { acct_type: 'expense', account_name: 'Marketing & Advertising - تشہیر' },
      { acct_type: 'expense', account_name: 'Professional Services - پیشہ ورانہ خدمات' },
      { acct_type: 'expense', account_name: 'Miscellaneous Expense - متفرق اخراجات' }
    ];

    try {
      for (const accountData of defaultExpenseAccounts) {
        await this.db.accounts.add({
          account_id: 0, // Will be auto-incremented
          account_name: accountData.account_name || '',
          acct_type: accountData.acct_type as 'expense'
        });
      }
    } catch (error) {
      console.error('Error creating default expense accounts:', error);
    }
  }

  private async createDefaultLiabilityAccounts(): Promise<void> {
    const defaultLiabilityAccounts: Partial<Account>[] = [
      { acct_type: 'liability', account_name: 'Bank Loan - بینک قرض' },
      { acct_type: 'liability', account_name: 'Personal Loan - ذاتی قرض' },
      { acct_type: 'liability', account_name: 'Advance from Customers - گاہکوں سے پیشگی' },
      { acct_type: 'liability', account_name: 'Salary Payable - تنخواہ واجب الادا' },
      { acct_type: 'liability', account_name: 'Rent Payable - کرایہ واجب الادا' }
    ];

    try {
      for (const accountData of defaultLiabilityAccounts) {
        await this.db.accounts.add({
          account_id: 0, // Will be auto-incremented
          account_name: accountData.account_name || '',
          acct_type: accountData.acct_type as 'liability'
        });
      }
    } catch (error) {
      console.error('Error creating default liability accounts:', error);
    }
  }

  private async loadRecentPayments(): Promise<void> {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Load vouchers from today that are payments
      const vouchers = await this.db.vouchers
        .where('date')
        .between(startOfDay, endOfDay)
        .and(voucher => voucher.voucher_type === 'payment')
        .reverse()
        .limit(10)
        .toArray();

      // Map vouchers to cash payment data with account names
      this.recentPayments = [];
      for (const voucher of vouchers) {
        const account = await this.db.accounts.get(voucher.account_id);
        
        this.recentPayments.push({
          voucher_id: voucher.voucher_id,
          date: new Date(voucher.date),
          account_id: voucher.account_id,
          account_name: account?.account_name || 'Unknown Account',
          payment_type: this.extractPaymentType(voucher.description || ''),
          payment_method: this.extractPaymentMethod(voucher.description || ''),
          debit: voucher.debit,
          description: voucher.description || '',
          reference_no: voucher.reference_no || undefined,
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error loading recent payments:', error);
    }
  }

  private extractPaymentType(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('supplier')) return 'supplier_payment';
    if (lowerDesc.includes('salary') || lowerDesc.includes('wage')) return 'salary';
    if (lowerDesc.includes('rent')) return 'rent';
    if (lowerDesc.includes('loan')) return 'loan_payment';
    if (lowerDesc.includes('advance')) return 'advance_payment';
    if (lowerDesc.includes('utility') || lowerDesc.includes('electricity') || lowerDesc.includes('gas')) return 'utilities';
    if (lowerDesc.includes('transport') || lowerDesc.includes('fuel')) return 'transportation';
    if (lowerDesc.includes('office')) return 'office_expense';
    
    return 'expense';
  }

  private extractPaymentMethod(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('bank') || lowerDesc.includes('transfer')) return 'bank_transfer';
    if (lowerDesc.includes('cheque') || lowerDesc.includes('check')) return 'cheque';
    if (lowerDesc.includes('online') || lowerDesc.includes('digital')) return 'online';
    
    return 'cash';
  }

  private async calculateTodaySummary(): Promise<void> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const todayPayments = await this.db.vouchers
        .where('date')
        .between(startOfDay, endOfDay)
        .and(voucher => voucher.voucher_type === 'payment')
        .toArray();

      const amounts = todayPayments.map(v => v.debit);
      const total = amounts.reduce((sum, amount) => sum + amount, 0);
      const count = todayPayments.length;
      const largest = count > 0 ? Math.max(...amounts) : 0;
      const average = count > 0 ? total / count : 0;

      this.todaySummary = { total, count, largest, average };
    } catch (error) {
      console.error('Error calculating today summary:', error);
    }
  }

  async addCashPayment(): Promise<void> {
    if (!this.paymentForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    try {
      this.isProcessing = true;
      const formData = this.paymentForm.value;

      // Build description with payment type and method
      const paymentTypeLabel = this.getPaymentTypeLabel(formData.paymentType);
      const paymentMethodLabel = this.getPaymentMethodLabel(formData.paymentMethod);
      const enhancedDescription = `${formData.description} [Type: ${paymentTypeLabel}, Method: ${paymentMethodLabel}]`;

      // Create voucher record
      const voucherId = await this.db.vouchers.add({
        date: new Date(formData.date),
        account_id: parseInt(formData.accountId),
        voucher_type: 'payment',
        debit: parseFloat(formData.amount),
        credit: 0,
        description: enhancedDescription,
        reference_no: formData.referenceNo || null
      });

      // Add to sync queue
      await this.db.addToSyncQueue('vouchers', voucherId, 'insert', {
        voucher_id: voucherId,
        account_id: parseInt(formData.accountId),
        amount: parseFloat(formData.amount),
        payment_type: formData.paymentType,
        payment_method: formData.paymentMethod
      });

      // Refresh data
      await Promise.all([
        this.loadRecentPayments(),
        this.calculateTodaySummary()
      ]);

      // Show success and highlight new record
      this.successMessage = 'Cash payment recorded successfully!';
      this.showSuccessMessage = true;
      this.showHighlight = true;
      
      // Clear form
      this.clearForm();
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        this.showSuccessMessage = false;
        this.showHighlight = false;
      }, 5000);

    } catch (error) {
      console.error('Error adding cash payment:', error);
      this.errorMessage = 'Failed to record cash payment. Please try again.';
    } finally {
      this.isProcessing = false;
    }
  }

  clearForm(): void {
    this.paymentForm.reset();
    this.paymentForm.patchValue({
      date: this.today,
      accountId: '',
      paymentType: '',
      paymentMethod: '',
      amount: '',
      referenceNo: '',
      description: '',
      notes: ''
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      const control = this.paymentForm.get(key);
      control?.markAsTouched();
    });
  }

  getPaymentTypeBadge(paymentType: string): string {
    const badges: Record<string, string> = {
      'supplier_payment': 'bg-warning',
      'expense': 'bg-danger',
      'loan_payment': 'bg-info',
      'advance_payment': 'bg-primary',
      'salary': 'bg-success',
      'rent': 'bg-warning',
      'utilities': 'bg-info',
      'transportation': 'bg-secondary',
      'office_expense': 'bg-dark',
      'miscellaneous': 'bg-secondary'
    };
    return badges[paymentType] || 'bg-secondary';
  }

  getPaymentTypeLabel(paymentType: string): string {
    const labels: Record<string, string> = {
      'supplier_payment': 'Supplier',
      'expense': 'Expense',
      'loan_payment': 'Loan',
      'advance_payment': 'Advance',
      'salary': 'Salary',
      'rent': 'Rent',
      'utilities': 'Utilities',
      'transportation': 'Transport',
      'office_expense': 'Office',
      'miscellaneous': 'Misc'
    };
    return labels[paymentType] || 'Other';
  }

  getPaymentMethodLabel(paymentMethod: string): string {
    const labels: Record<string, string> = {
      'cash': 'Cash',
      'bank_transfer': 'Bank Transfer',
      'cheque': 'Cheque',
      'online': 'Online'
    };
    return labels[paymentMethod] || 'Cash';
  }

  viewPayment(payment: CashPaymentData): void {
    this.selectedPayment = payment;
  }

  editPayment(payment: CashPaymentData): void {
    // Populate form with payment data for editing
    this.paymentForm.patchValue({
      date: payment.date.toISOString().split('T')[0],
      accountId: payment.account_id.toString(),
      paymentType: payment.payment_type,
      paymentMethod: payment.payment_method,
      amount: payment.debit,
      referenceNo: payment.reference_no || '',
      description: this.extractOriginalDescription(payment.description),
      notes: payment.notes || ''
    });
    
    // Scroll to form
    document.querySelector('.cash-payment-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  private extractOriginalDescription(description: string): string {
    // Remove the enhanced part with [Type: ... Method: ...]
    const match = description.match(/^(.+?)\s*\[Type:/);
    return match ? match[1].trim() : description;
  }

  async deletePayment(payment: CashPaymentData): Promise<void> {
    if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      return;
    }

    try {
      if (payment.voucher_id) {
        await this.db.vouchers.delete(payment.voucher_id);
        
        // Add to sync queue for deletion
        await this.db.addToSyncQueue('vouchers', payment.voucher_id, 'delete', {
          voucher_id: payment.voucher_id
        });
        
        // Refresh data
        await Promise.all([
          this.loadRecentPayments(),
          this.calculateTodaySummary()
        ]);
        
        this.successMessage = 'Cash payment deleted successfully.';
        this.showSuccessMessage = true;
        
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 3000);
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      this.errorMessage = 'Failed to delete payment. Please try again.';
    }
  }

  trackPayment(index: number, payment: CashPaymentData): number {
    return payment.voucher_id || index;
  }

  async refreshData(): Promise<void> {
    await this.loadInitialData();
  }

  async exportData(): Promise<void> {
    try {
      // Get all payments from this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const payments = await this.db.vouchers
        .where('date')
        .between(startOfMonth, endOfMonth)
        .and(voucher => voucher.voucher_type === 'payment')
        .toArray();

      // Create CSV content
      let csvContent = 'Date,Account,Amount,Type,Method,Description,Reference\n';
      
      for (const payment of payments) {
        const account = await this.db.accounts.get(payment.account_id);
        const paymentType = this.extractPaymentType(payment.description || '');
        const paymentMethod = this.extractPaymentMethod(payment.description || '');
        
        csvContent += `${new Date(payment.date).toLocaleDateString()},`;
        csvContent += `"${account?.account_name || 'Unknown'}",`;
        csvContent += `${payment.debit},`;
        csvContent += `${this.getPaymentTypeLabel(paymentType)},`;
        csvContent += `${this.getPaymentMethodLabel(paymentMethod)},`;
        csvContent += `"${this.extractOriginalDescription(payment.description || '')}",`;
        csvContent += `"${payment.reference_no || ''}"\n`;
      }

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cash-payments-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.successMessage = 'Cash payments exported successfully!';
      this.showSuccessMessage = true;
      
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);

    } catch (error) {
      console.error('Error exporting data:', error);
      this.errorMessage = 'Failed to export data. Please try again.';
    }
  }
}