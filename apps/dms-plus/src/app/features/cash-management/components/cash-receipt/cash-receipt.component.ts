import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Account } from '../../../../core/models/database.models';
import { AuthService } from '../../../../core/services/auth.service';
import { DatabaseService } from '../../../../core/services/database.service';

interface CashReceiptData {
  voucher_id?: number;
  date: Date;
  account_id: number;
  account_name: string;
  receipt_type: string;
  credit: number;
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
  selector: 'app-cash-receipt',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cash-receipt.component.html',
  styleUrls: ['./cash-receipt.component.scss']
})
export class CashReceiptComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private db = inject(DatabaseService);
  private authService = inject(AuthService);

  // Form
  receiptForm!: FormGroup;

  // Data arrays
  incomeAccounts: Account[] = [];
  assetAccounts: Account[] = [];
  customerAccounts: Account[] = [];
  recentReceipts: CashReceiptData[] = [];

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
  selectedReceipt: CashReceiptData | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
  }

  private initializeForm(): void {
    this.receiptForm = this.fb.group({
      date: [this.today, Validators.required],
      accountId: ['', Validators.required],
      receiptType: ['', Validators.required],
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
        this.loadRecentReceipts(),
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
      
      this.incomeAccounts = allAccounts.filter(acc => acc.acct_type === 'income');
      this.assetAccounts = allAccounts.filter(acc => acc.acct_type === 'asset');
      this.customerAccounts = allAccounts.filter(acc => acc.acct_type === 'customer');

      // Add default accounts if they don't exist
      if (this.incomeAccounts.length === 0) {
        await this.createDefaultIncomeAccounts();
        this.incomeAccounts = await this.db.accounts
          .where('acct_type')
          .equals('income')
          .toArray();
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  }

  private async createDefaultIncomeAccounts(): Promise<void> {
    const defaultIncomeAccounts: Partial<Account>[] = [
      { acct_type: 'income', account_name: 'Other Income - دیگر آمدن' },
      { acct_type: 'income', account_name: 'Bank Interest - بینک سود' },
      { acct_type: 'income', account_name: 'Rental Income - کرایہ' },
      { acct_type: 'asset', account_name: 'Cash in Hand - ہاتھ میں نقد' },
      { acct_type: 'asset', account_name: 'Bank Account - بینک اکاؤنٹ' }
    ];

    try {
      for (const accountData of defaultIncomeAccounts) {
        await this.db.accounts.add({
          account_id: 0, // Will be auto-incremented
          account_name: accountData.account_name || '',
          acct_type: accountData.acct_type as 'income' | 'asset'
        });
      }
    } catch (error) {
      console.error('Error creating default accounts:', error);
    }
  }

  private async loadRecentReceipts(): Promise<void> {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Load vouchers from today that are receipts
      const vouchers = await this.db.vouchers
        .where('date')
        .between(startOfDay, endOfDay)
        .and(voucher => voucher.voucher_type === 'receipt')
        .reverse()
        .limit(10)
        .toArray();

      // Map vouchers to cash receipt data with account names
      this.recentReceipts = [];
      for (const voucher of vouchers) {
        const account = await this.db.accounts.get(voucher.account_id);
        
        this.recentReceipts.push({
          voucher_id: voucher.voucher_id,
          date: new Date(voucher.date),
          account_id: voucher.account_id,
          account_name: account?.account_name || 'Unknown Account',
          receipt_type: this.extractReceiptType(voucher.description || ''),
          credit: voucher.credit,
          description: voucher.description || '',
          reference_no: voucher.reference_no || undefined,
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error loading recent receipts:', error);
    }
  }

  private extractReceiptType(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('customer') || lowerDesc.includes('payment')) return 'customer_payment';
    if (lowerDesc.includes('loan')) return 'loan_received';
    if (lowerDesc.includes('advance')) return 'advance_received';
    if (lowerDesc.includes('asset') || lowerDesc.includes('sale')) return 'sale_of_asset';
    if (lowerDesc.includes('interest') || lowerDesc.includes('bank')) return 'bank_interest';
    if (lowerDesc.includes('capital')) return 'capital_injection';
    
    return 'other_income';
  }

  private async calculateTodaySummary(): Promise<void> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const todayReceipts = await this.db.vouchers
        .where('date')
        .between(startOfDay, endOfDay)
        .and(voucher => voucher.voucher_type === 'receipt')
        .toArray();

      const amounts = todayReceipts.map(v => v.credit);
      const total = amounts.reduce((sum, amount) => sum + amount, 0);
      const count = todayReceipts.length;
      const largest = count > 0 ? Math.max(...amounts) : 0;
      const average = count > 0 ? total / count : 0;

      this.todaySummary = { total, count, largest, average };
    } catch (error) {
      console.error('Error calculating today summary:', error);
    }
  }

  async addCashReceipt(): Promise<void> {
    if (!this.receiptForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    try {
      this.isProcessing = true;
      const formData = this.receiptForm.value;

      // Create voucher record
      const voucherId = await this.db.vouchers.add({
        date: new Date(formData.date),
        account_id: parseInt(formData.accountId),
        voucher_type: 'receipt',
        credit: parseFloat(formData.amount),
        debit: 0,
        description: formData.description,
        reference_no: formData.referenceNo || null,
        sync_status: 'pending'
      });

      // Add to sync queue
      await this.db.addToSyncQueue('vouchers', voucherId, 'insert', {
        voucher_id: voucherId,
        account_id: parseInt(formData.accountId),
        amount: parseFloat(formData.amount),
        receipt_type: formData.receiptType
      });

      // Refresh data
      await Promise.all([
        this.loadRecentReceipts(),
        this.calculateTodaySummary()
      ]);

      // Show success and highlight new record
      this.successMessage = 'Cash receipt added successfully!';
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
      console.error('Error adding cash receipt:', error);
      this.errorMessage = 'Failed to add cash receipt. Please try again.';
    } finally {
      this.isProcessing = false;
    }
  }

  clearForm(): void {
    this.receiptForm.reset();
    this.receiptForm.patchValue({
      date: this.today,
      accountId: '',
      receiptType: '',
      amount: '',
      referenceNo: '',
      description: '',
      notes: ''
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.receiptForm.controls).forEach(key => {
      const control = this.receiptForm.get(key);
      control?.markAsTouched();
    });
  }

  getReceiptTypeBadge(receiptType: string): string {
    const badges: Record<string, string> = {
      'customer_payment': 'bg-success',
      'loan_received': 'bg-warning',
      'advance_received': 'bg-info',
      'sale_of_asset': 'bg-primary',
      'bank_interest': 'bg-success',
      'other_income': 'bg-secondary',
      'capital_injection': 'bg-danger',
      'miscellaneous': 'bg-secondary'
    };
    return badges[receiptType] || 'bg-secondary';
  }

  getReceiptTypeLabel(receiptType: string): string {
    const labels: Record<string, string> = {
      'customer_payment': 'Customer Payment',
      'loan_received': 'Loan Received',
      'advance_received': 'Advance Received',
      'sale_of_asset': 'Asset Sale',
      'bank_interest': 'Bank Interest',
      'other_income': 'Other Income',
      'capital_injection': 'Capital',
      'miscellaneous': 'Misc'
    };
    return labels[receiptType] || 'Other';
  }

  viewReceipt(receipt: CashReceiptData): void {
    this.selectedReceipt = receipt;
    // In a real application, you would use a proper modal service
    // For now, we'll just set the selectedReceipt and the modal can be triggered
  }

  editReceipt(receipt: CashReceiptData): void {
    // Populate form with receipt data for editing
    this.receiptForm.patchValue({
      date: receipt.date.toISOString().split('T')[0],
      accountId: receipt.account_id.toString(),
      receiptType: receipt.receipt_type,
      amount: receipt.credit,
      referenceNo: receipt.reference_no || '',
      description: receipt.description,
      notes: receipt.notes || ''
    });
    
    // Scroll to form
    document.querySelector('.cash-receipt-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  async deleteReceipt(receipt: CashReceiptData): Promise<void> {
    if (!confirm('Are you sure you want to delete this cash receipt? This action cannot be undone.')) {
      return;
    }

    try {
      if (receipt.voucher_id) {
        await this.db.vouchers.delete(receipt.voucher_id);
        
        // Add to sync queue for deletion
        await this.db.addToSyncQueue('vouchers', receipt.voucher_id, 'delete', {
          voucher_id: receipt.voucher_id
        });
        
        // Refresh data
        await Promise.all([
          this.loadRecentReceipts(),
          this.calculateTodaySummary()
        ]);
        
        this.successMessage = 'Cash receipt deleted successfully.';
        this.showSuccessMessage = true;
        
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 3000);
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      this.errorMessage = 'Failed to delete receipt. Please try again.';
    }
  }

  async refreshData(): Promise<void> {
    await this.loadInitialData();
  }

  async exportData(): Promise<void> {
    try {
      // Get all receipts from this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const receipts = await this.db.vouchers
        .where('date')
        .between(startOfMonth, endOfMonth)
        .and(voucher => voucher.voucher_type === 'receipt')
        .toArray();

      // Create CSV content
      let csvContent = 'Date,Account,Amount,Description,Reference,Type\n';
      
      for (const receipt of receipts) {
        const account = await this.db.accounts.get(receipt.account_id);
        const receiptType = this.extractReceiptType(receipt.description || '');
        
        csvContent += `${new Date(receipt.date).toLocaleDateString()},`;
        csvContent += `"${account?.account_name || 'Unknown'}",`;
        csvContent += `${receipt.credit},`;
        csvContent += `"${receipt.description || ''}",`;
        csvContent += `"${receipt.reference_no || ''}",`;
        csvContent += `${this.getReceiptTypeLabel(receiptType)}\n`;
      }

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cash-receipts-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.successMessage = 'Cash receipts exported successfully!';
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