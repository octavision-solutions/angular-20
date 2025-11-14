import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  CardModule, 
  TableModule, 
  ButtonModule, 
  FormModule, 
  ModalModule,
  BadgeModule,
  CollapseModule,
  GridModule,
  SpinnerModule,
  AlertModule
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { 
  ChartOfAccountsService,
  ChartOfAccount
} from '../../../core/services/chart-of-accounts.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'acc-chart-of-accounts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    FormModule,
    ModalModule,
    BadgeModule,
    CollapseModule,
    GridModule,
    SpinnerModule,
    AlertModule,
    IconModule
  ],
  templateUrl: './chart-of-accounts.component.html',
  styleUrls: ['./chart-of-accounts.component.scss']
})
export class ChartOfAccountsComponent implements OnInit {
  private chartOfAccountsService = inject(ChartOfAccountsService);
  
  accounts: ChartOfAccount[] = [];
  filteredAccounts: ChartOfAccount[] = [];
  accountTree: ChartOfAccount[] = [];
  
  searchTerm = '';
  selectedAccountType = '';
  showAddModal = false;
  loading = false;
  error = '';
  
  accountTypes = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' }
  ];

  ngOnInit(): void {
    this.loadChartOfAccounts();
  }

  loadChartOfAccounts(): void {
    this.loading = true;
    this.error = '';
    
    this.chartOfAccountsService.getChartOfAccounts()
      .pipe(
        catchError(error => {
          this.error = error.message || 'Failed to load chart of accounts';
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(accounts => {
        this.accounts = accounts;
        this.filteredAccounts = [...accounts];
        this.accountTree = this.chartOfAccountsService.buildAccountTree(accounts);
      });
  }

  getParentAccounts(): ChartOfAccount[] {
    return this.accounts.filter(account => account.level < 4);
  }

  filterAccounts(): void {
    this.filteredAccounts = this.accounts.filter(account => {
      const matchesSearch = this.searchTerm === '' || 
        account.account_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        account.account_code.includes(this.searchTerm);
      
      const matchesType = this.selectedAccountType === '' || 
        account.account_type === this.selectedAccountType;
      
      return matchesSearch && matchesType;
    });
  }

  getAccountTypeColor(type: string): string {
    switch (type.toLowerCase()) {
      case 'asset': return 'success';
      case 'liability': return 'danger';
      case 'equity': return 'info';
      case 'revenue': return 'primary';
      case 'expense': return 'warning';
      default: return 'secondary';
    }
  }

  getAccountTypeLabel(type: string): string {
    switch (type.toLowerCase()) {
      case 'asset': return 'Asset';
      case 'liability': return 'Liability';
      case 'equity': return 'Equity';
      case 'revenue': return 'Revenue';
      case 'expense': return 'Expense';
      default: return type;
    }
  }

  getIndentation(level: number): string {
    return '&nbsp;'.repeat((level - 1) * 4);
  }

  addAccount(): void {
    this.showAddModal = true;
  }

  editAccount(account: ChartOfAccount): void {
    console.log('Editing account:', account);
    // TODO: Implement account editing modal
  }

  deleteAccount(account: ChartOfAccount): void {
    if (confirm(`Are you sure you want to delete account "${account.account_name}"?`)) {
      this.chartOfAccountsService.deleteAccount(account.id)
        .pipe(
          catchError(error => {
            alert(`Error deleting account: ${error.message}`);
            return of(false);
          })
        )
        .subscribe(success => {
          if (success) {
            this.loadChartOfAccounts(); // Reload the list
          }
        });
    }
  }

  toggleAccountStatus(account: ChartOfAccount): void {
    this.chartOfAccountsService.toggleAccountStatus(account.id)
      .pipe(
        catchError(error => {
          alert(`Error toggling account status: ${error.message}`);
          return of(null);
        })
      )
      .subscribe(updatedAccount => {
        if (updatedAccount) {
          this.loadChartOfAccounts(); // Reload the list
        }
      });
  }

  exportToExcel(): void {
    console.log('Exporting Chart of Accounts to Excel...');
    // TODO: Implement Excel export functionality
  }

  importFromExcel(): void {
    console.log('Importing Chart of Accounts from Excel...');
    // TODO: Implement Excel import functionality
  }

  refreshAccounts(): void {
    this.loadChartOfAccounts();
  }
}