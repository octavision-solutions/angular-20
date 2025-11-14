import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { DatabaseService } from '../../../../core/services/database.service';

interface ExpenseData {
  expense_id?: number;
  date: Date;
  category: string;
  subCategory?: string;
  vendor: string;
  amount: number;
  taxAmount?: number;
  paymentMethod: string;
  invoiceNo?: string;
  description: string;
  notes?: string;
  isRecurring: boolean;
  frequency?: string;
  createdAt: Date;
}

interface CategorySummary {
  category: string;
  amount: number;
  count: number;
}

interface MonthlySummary {
  total: number;
  count: number;
}

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.scss']
})
export class ExpenseComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private db = inject(DatabaseService);
  private authService = inject(AuthService);

  // Form
  expenseForm!: FormGroup;

  // Data arrays
  expenses: ExpenseData[] = [];
  filteredExpenses: ExpenseData[] = [];
  frequentVendors: string[] = [];
  subCategories: { value: string; label: string }[] = [];
  topCategories: CategorySummary[] = [];

  // State
  isLoading = false;
  isProcessing = false;
  showSuccessMessage = false;
  showHighlight = false;
  successMessage = '';
  errorMessage = '';
  today = new Date().toISOString().split('T')[0];
  currentView: 'list' | 'card' = 'list';
  searchTerm = '';

  // Summary data
  todaySummary: MonthlySummary = { total: 0, count: 0 };
  monthSummary: MonthlySummary = { total: 0, count: 0 };
  selectedExpense: ExpenseData | null = null;

  // Category subcategories mapping
  private categorySubcategories: Record<string, { value: string; label: string }[]> = {
    rent: [
      { value: 'office_rent', label: 'Office Rent - دفتری کرایہ' },
      { value: 'warehouse_rent', label: 'Warehouse Rent - گودام کرایہ' },
      { value: 'shop_rent', label: 'Shop Rent - دکان کرایہ' }
    ],
    utilities: [
      { value: 'electricity', label: 'Electricity - بجلی' },
      { value: 'gas', label: 'Gas - گیس' },
      { value: 'water', label: 'Water - پانی' },
      { value: 'internet', label: 'Internet - انٹرنیٹ' }
    ],
    transportation: [
      { value: 'fuel', label: 'Fuel - ایندھن' },
      { value: 'vehicle_maintenance', label: 'Vehicle Maintenance - گاڑی کی مرمت' },
      { value: 'delivery', label: 'Delivery Charges - ڈیلیوری چارجز' }
    ],
    office_supplies: [
      { value: 'stationery', label: 'Stationery - لکھنے کا سامان' },
      { value: 'computer_supplies', label: 'Computer Supplies - کمپیوٹر سامان' },
      { value: 'office_equipment', label: 'Office Equipment - دفتری آلات' }
    ],
    communication: [
      { value: 'telephone', label: 'Telephone - ٹیلیفون' },
      { value: 'mobile', label: 'Mobile - موبائل' },
      { value: 'postage', label: 'Postage - ڈاک' }
    ]
  };

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
  }

  private initializeForm(): void {
    this.expenseForm = this.fb.group({
      date: [this.today, Validators.required],
      category: ['', Validators.required],
      subCategory: [''],
      vendor: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      taxAmount: [''],
      paymentMethod: ['', Validators.required],
      invoiceNo: [''],
      description: ['', Validators.required],
      notes: [''],
      isRecurring: [false],
      frequency: ['monthly']
    });
  }

  private async loadInitialData(): Promise<void> {
    try {
      this.isLoading = true;
      
      await Promise.all([
        this.loadExpenses(),
        this.loadFrequentVendors(),
        this.calculateSummaries(),
        this.calculateTopCategories()
      ]);
      
      this.filterExpenses();
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.errorMessage = 'Failed to load data. Please refresh the page.';
    } finally {
      this.isLoading = false;
    }
  }

  private async loadExpenses(): Promise<void> {
    try {
      // For now, we'll simulate expenses data since we don't have a dedicated expenses table
      // In a real implementation, you would create a dedicated expenses table in the database
      this.expenses = [
        {
          expense_id: 1,
          date: new Date(),
          category: 'rent',
          subCategory: 'office_rent',
          vendor: 'Property Owner',
          amount: 50000,
          taxAmount: 0,
          paymentMethod: 'bank_transfer',
          invoiceNo: 'RENT001',
          description: 'Monthly office rent payment',
          notes: '',
          isRecurring: true,
          frequency: 'monthly',
          createdAt: new Date()
        },
        {
          expense_id: 2,
          date: new Date(),
          category: 'utilities',
          subCategory: 'electricity',
          vendor: 'LESCO',
          amount: 8500,
          taxAmount: 1500,
          paymentMethod: 'cash',
          invoiceNo: 'ELEC001',
          description: 'Monthly electricity bill',
          notes: 'High usage this month due to summer',
          isRecurring: true,
          frequency: 'monthly',
          createdAt: new Date()
        }
      ];
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  }

  private async loadFrequentVendors(): Promise<void> {
    try {
      // Extract unique vendors from existing expenses
      const vendorsSet = new Set(this.expenses.map(exp => exp.vendor));
      this.frequentVendors = Array.from(vendorsSet);
      
      // Add some common Pakistani vendors
      const commonVendors = [
        'LESCO', 'SSGC', 'PTCL', 'Jazz', 'Telenor', 'Zong',
        'Property Owner', 'Office Supplies Store', 'Fuel Station',
        'Maintenance Service', 'Internet Provider'
      ];
      
      commonVendors.forEach(vendor => {
        if (!this.frequentVendors.includes(vendor)) {
          this.frequentVendors.push(vendor);
        }
      });
    } catch (error) {
      console.error('Error loading frequent vendors:', error);
    }
  }

  private async calculateSummaries(): Promise<void> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Calculate today's summary
      const todayExpenses = this.expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= startOfDay && expDate <= endOfDay;
      });
      
      this.todaySummary = {
        total: todayExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        count: todayExpenses.length
      };

      // Calculate this month's summary
      const monthExpenses = this.expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= startOfMonth && expDate <= endOfMonth;
      });
      
      this.monthSummary = {
        total: monthExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        count: monthExpenses.length
      };
    } catch (error) {
      console.error('Error calculating summaries:', error);
    }
  }

  private async calculateTopCategories(): Promise<void> {
    try {
      const categoryTotals: Record<string, { amount: number; count: number }> = {};
      
      this.expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
          categoryTotals[expense.category] = { amount: 0, count: 0 };
        }
        categoryTotals[expense.category].amount += expense.amount;
        categoryTotals[expense.category].count += 1;
      });
      
      this.topCategories = Object.entries(categoryTotals)
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          count: data.count
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
    } catch (error) {
      console.error('Error calculating top categories:', error);
    }
  }

  onCategoryChange(): void {
    const selectedCategory = this.expenseForm.get('category')?.value;
    this.subCategories = this.categorySubcategories[selectedCategory] || [];
    
    // Clear subcategory if category changed
    this.expenseForm.patchValue({ subCategory: '' });
  }

  onRecurringChange(): void {
    const isRecurring = this.expenseForm.get('isRecurring')?.value;
    if (!isRecurring) {
      this.expenseForm.patchValue({ frequency: '' });
    } else {
      this.expenseForm.patchValue({ frequency: 'monthly' });
    }
  }

  async addExpense(): Promise<void> {
    if (!this.expenseForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    try {
      this.isProcessing = true;
      const formData = this.expenseForm.value;

      // Create new expense record
      const newExpense: ExpenseData = {
        expense_id: this.expenses.length + 1, // In real app, this would be auto-generated
        date: new Date(formData.date),
        category: formData.category,
        subCategory: formData.subCategory || undefined,
        vendor: formData.vendor,
        amount: parseFloat(formData.amount),
        taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
        paymentMethod: formData.paymentMethod,
        invoiceNo: formData.invoiceNo || undefined,
        description: formData.description,
        notes: formData.notes || undefined,
        isRecurring: formData.isRecurring,
        frequency: formData.isRecurring ? formData.frequency : undefined,
        createdAt: new Date()
      };

      // Add to expenses array (in real app, this would be saved to database)
      this.expenses.unshift(newExpense);

      // Also create a voucher entry for accounting
      await this.createVoucherEntry(newExpense);

      // Refresh all data
      await Promise.all([
        this.calculateSummaries(),
        this.calculateTopCategories(),
        this.loadFrequentVendors()
      ]);
      
      this.filterExpenses();

      // Show success and highlight new record
      this.successMessage = 'Expense recorded successfully!';
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
      console.error('Error adding expense:', error);
      this.errorMessage = 'Failed to record expense. Please try again.';
    } finally {
      this.isProcessing = false;
    }
  }

  private async createVoucherEntry(expense: ExpenseData): Promise<void> {
    try {
      // Find or create expense account
      let expenseAccount = await this.db.accounts
        .where('acct_type')
        .equals('expense')
        .and(acc => acc.account_name.toLowerCase().includes(expense.category))
        .first();

      if (!expenseAccount) {
        // Create new expense account
        const accountId = await this.db.accounts.add({
          account_id: 0,
          account_name: `${this.getCategoryLabel(expense.category)} - Expense`,
          acct_type: 'expense'
        });
        expenseAccount = await this.db.accounts.get(accountId);
      }

      if (expenseAccount) {
        // Create voucher entry
        const voucherId = await this.db.vouchers.add({
          date: expense.date,
          account_id: expenseAccount.account_id ?? 0,
          voucher_type: 'payment',
          debit: expense.amount,
          credit: 0,
          description: `${expense.description} [${expense.vendor}]`,
          reference_no: expense.invoiceNo || undefined
        });

        // Add to sync queue
        await this.db.addToSyncQueue('vouchers', voucherId, 'insert', {
          expense_id: expense.expense_id,
          category: expense.category,
          vendor: expense.vendor
        });
      }
    } catch (error) {
      console.error('Error creating voucher entry:', error);
    }
  }

  clearForm(): void {
    this.expenseForm.reset();
    this.expenseForm.patchValue({
      date: this.today,
      category: '',
      subCategory: '',
      vendor: '',
      amount: '',
      taxAmount: '',
      paymentMethod: '',
      invoiceNo: '',
      description: '',
      notes: '',
      isRecurring: false,
      frequency: 'monthly'
    });
    this.subCategories = [];
  }

  private markFormGroupTouched(): void {
    Object.keys(this.expenseForm.controls).forEach(key => {
      const control = this.expenseForm.get(key);
      control?.markAsTouched();
    });
  }

  toggleView(): void {
    this.currentView = this.currentView === 'list' ? 'card' : 'list';
  }

  filterExpenses(): void {
    if (!this.searchTerm.trim()) {
      this.filteredExpenses = [...this.expenses];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredExpenses = this.expenses.filter(expense =>
        expense.vendor.toLowerCase().includes(term) ||
        expense.description.toLowerCase().includes(term) ||
        expense.category.toLowerCase().includes(term) ||
        (expense.invoiceNo && expense.invoiceNo.toLowerCase().includes(term))
      );
    }
  }

  getCategoryBadge(category: string): string {
    const badges: Record<string, string> = {
      'rent': 'bg-warning',
      'utilities': 'bg-info',
      'transportation': 'bg-primary',
      'office_supplies': 'bg-secondary',
      'communication': 'bg-info',
      'marketing': 'bg-success',
      'professional': 'bg-dark',
      'maintenance': 'bg-danger',
      'insurance': 'bg-primary',
      'legal': 'bg-dark',
      'travel': 'bg-primary',
      'entertainment': 'bg-success',
      'equipment': 'bg-secondary',
      'training': 'bg-info',
      'miscellaneous': 'bg-light'
    };
    return badges[category] || 'bg-secondary';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'rent': 'Rent',
      'utilities': 'Utilities',
      'transportation': 'Transport',
      'office_supplies': 'Office',
      'communication': 'Comms',
      'marketing': 'Marketing',
      'professional': 'Services',
      'maintenance': 'Maintenance',
      'insurance': 'Insurance',
      'legal': 'Legal',
      'travel': 'Travel',
      'entertainment': 'Entertainment',
      'equipment': 'Equipment',
      'training': 'Training',
      'miscellaneous': 'Misc'
    };
    return labels[category] || 'Other';
  }

  getPaymentMethodLabel(paymentMethod: string): string {
    const labels: Record<string, string> = {
      'cash': 'Cash',
      'bank_transfer': 'Bank Transfer',
      'cheque': 'Cheque',
      'credit_card': 'Credit Card',
      'online': 'Online'
    };
    return labels[paymentMethod] || 'Cash';
  }

  viewExpense(expense: ExpenseData): void {
    this.selectedExpense = expense;
  }

  editExpense(expense: ExpenseData): void {
    // Populate form with expense data for editing
    this.expenseForm.patchValue({
      date: expense.date.toISOString().split('T')[0],
      category: expense.category,
      subCategory: expense.subCategory || '',
      vendor: expense.vendor,
      amount: expense.amount,
      taxAmount: expense.taxAmount || '',
      paymentMethod: expense.paymentMethod,
      invoiceNo: expense.invoiceNo || '',
      description: expense.description,
      notes: expense.notes || '',
      isRecurring: expense.isRecurring,
      frequency: expense.frequency || 'monthly'
    });
    
    // Update subcategories based on selected category
    this.onCategoryChange();
    
    // Scroll to form
    document.querySelector('.expense-form')?.scrollIntoView({ behavior: 'smooth' });
    
    // Close modal if open
    this.selectedExpense = null;
  }

  async deleteExpense(expense: ExpenseData): Promise<void> {
    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }

    try {
      // Remove from expenses array
      const index = this.expenses.findIndex(exp => exp.expense_id === expense.expense_id);
      if (index > -1) {
        this.expenses.splice(index, 1);
      }

      // In real app, also delete from database and related voucher entries
      
      // Refresh data
      await Promise.all([
        this.calculateSummaries(),
        this.calculateTopCategories()
      ]);
      
      this.filterExpenses();
      
      this.successMessage = 'Expense deleted successfully.';
      this.showSuccessMessage = true;
      
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);

    } catch (error) {
      console.error('Error deleting expense:', error);
      this.errorMessage = 'Failed to delete expense. Please try again.';
    }
  }

  trackExpense(index: number, expense: ExpenseData): number {
    return expense.expense_id || index;
  }

  async refreshData(): Promise<void> {
    await this.loadInitialData();
  }

  async exportData(): Promise<void> {
    try {
      // Create CSV content
      let csvContent = 'Date,Category,Subcategory,Vendor,Amount,Tax,Payment Method,Invoice,Description,Recurring,Notes\n';
      
      this.expenses.forEach(expense => {
        csvContent += `${new Date(expense.date).toLocaleDateString()},`;
        csvContent += `"${this.getCategoryLabel(expense.category)}",`;
        csvContent += `"${expense.subCategory || ''}",`;
        csvContent += `"${expense.vendor}",`;
        csvContent += `${expense.amount},`;
        csvContent += `${expense.taxAmount || 0},`;
        csvContent += `${this.getPaymentMethodLabel(expense.paymentMethod)},`;
        csvContent += `"${expense.invoiceNo || ''}",`;
        csvContent += `"${expense.description}",`;
        csvContent += `${expense.isRecurring ? expense.frequency : 'No'},`;
        csvContent += `"${expense.notes || ''}"\n`;
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-expenses-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.successMessage = 'Expense data exported successfully!';
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