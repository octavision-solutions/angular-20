import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface ChartOfAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_sub_type: string;
  parent_account_id: number | null;
  level: number;
  is_active: boolean;
  has_children: boolean;
  description?: string;
}

export interface ChartOfAccountsResponse {
  success: boolean;
  data: ChartOfAccount[];
  meta: {
    total_accounts: number;
    levels: number;
    structure: {
      level_1: string;
      level_2: string;
      level_3: string;
      level_4: string;
    };
  };
  message?: string;
}

export interface CreateAccountRequest {
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_sub_type: string;
  parent_account_id?: number;
  description?: string;
}

export interface UpdateAccountRequest extends CreateAccountRequest {
  is_active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChartOfAccountsService {
  private readonly API_BASE_URL = 'http://localhost:8080/api/v1';
  
  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);

  /**
   * Get all chart of accounts for current tenant
   */
  getChartOfAccounts(): Observable<ChartOfAccount[]> {
    return this.httpClient.get<ChartOfAccountsResponse>(
      `${this.API_BASE_URL}/chart-of-accounts`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch chart of accounts');
      }),
      catchError(error => {
        console.error('Error fetching chart of accounts:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get chart of accounts with hierarchy structure
   */
  getChartOfAccountsWithHierarchy(): Observable<ChartOfAccountsResponse> {
    return this.httpClient.get<ChartOfAccountsResponse>(
      `${this.API_BASE_URL}/chart-of-accounts`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error fetching chart of accounts with hierarchy:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get accounts by level (1-4)
   */
  getAccountsByLevel(level: number): Observable<ChartOfAccount[]> {
    return this.getChartOfAccounts().pipe(
      map(accounts => accounts.filter(account => account.level === level))
    );
  }

  /**
   * Get accounts by type
   */
  getAccountsByType(type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'): Observable<ChartOfAccount[]> {
    return this.getChartOfAccounts().pipe(
      map(accounts => accounts.filter(account => account.account_type === type))
    );
  }

  /**
   * Get child accounts for a parent account
   */
  getChildAccounts(parentId: number): Observable<ChartOfAccount[]> {
    return this.getChartOfAccounts().pipe(
      map(accounts => accounts.filter(account => account.parent_account_id === parentId))
    );
  }

  /**
   * Get account by ID
   */
  getAccountById(id: number): Observable<ChartOfAccount | undefined> {
    return this.getChartOfAccounts().pipe(
      map(accounts => accounts.find(account => account.id === id))
    );
  }

  /**
   * Search accounts by name or code
   */
  searchAccounts(searchTerm: string): Observable<ChartOfAccount[]> {
    return this.getChartOfAccounts().pipe(
      map(accounts => accounts.filter(account => 
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_code.includes(searchTerm)
      ))
    );
  }

  /**
   * Create new account
   */
  createAccount(account: CreateAccountRequest): Observable<ChartOfAccount> {
    return this.httpClient.post<{ success: boolean; data: ChartOfAccount; message?: string }>(
      `${this.API_BASE_URL}/chart-of-accounts`,
      account,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to create account');
      }),
      catchError(error => {
        console.error('Error creating account:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing account
   */
  updateAccount(id: number, account: UpdateAccountRequest): Observable<ChartOfAccount> {
    return this.httpClient.put<{ success: boolean; data: ChartOfAccount; message?: string }>(
      `${this.API_BASE_URL}/chart-of-accounts/${id}`,
      account,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to update account');
      }),
      catchError(error => {
        console.error('Error updating account:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete account (if no transactions exist)
   */
  deleteAccount(id: number): Observable<boolean> {
    return this.httpClient.delete<{ success: boolean; message?: string }>(
      `${this.API_BASE_URL}/chart-of-accounts/${id}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          return true;
        }
        throw new Error(response.message || 'Failed to delete account');
      }),
      catchError(error => {
        console.error('Error deleting account:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Toggle account active status
   */
  toggleAccountStatus(id: number): Observable<ChartOfAccount> {
    return this.httpClient.patch<{ success: boolean; data: ChartOfAccount; message?: string }>(
      `${this.API_BASE_URL}/chart-of-accounts/${id}/toggle-status`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to toggle account status');
      }),
      catchError(error => {
        console.error('Error toggling account status:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Build hierarchical tree structure from flat account list
   */
  buildAccountTree(accounts: ChartOfAccount[]): ChartOfAccount[] {
    const accountMap = new Map<number, ChartOfAccount & { children?: ChartOfAccount[] }>();
    const rootAccounts: (ChartOfAccount & { children?: ChartOfAccount[] })[] = [];

    // Create map of all accounts
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Build tree structure
    accounts.forEach(account => {
      const accountWithChildren = accountMap.get(account.id);
      if (!accountWithChildren) return;
      
      if (account.parent_account_id === null) {
        rootAccounts.push(accountWithChildren);
      } else {
        const parent = accountMap.get(account.parent_account_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(accountWithChildren);
        }
      }
    });

    return rootAccounts;
  }

  /**
   * Get available account codes for a specific level
   */
  getAvailableAccountCodes(level: number, parentCode?: string): string[] {
    const codes: string[] = [];
    
    switch (level) {
      case 1:
        // Level 1: 1000, 2000, 3000, etc.
        for (let i = 1; i <= 9; i++) {
          codes.push(`${i}000`);
        }
        break;
      case 2:
        // Level 2: 1100, 1200, etc.
        if (parentCode) {
          const prefix = parentCode.substring(0, 1);
          for (let i = 1; i <= 9; i++) {
            codes.push(`${prefix}${i}00`);
          }
        }
        break;
      case 3:
        // Level 3: 1110, 1120, etc.
        if (parentCode) {
          const prefix = parentCode.substring(0, 2);
          for (let i = 1; i <= 9; i++) {
            codes.push(`${prefix}${i}0`);
          }
        }
        break;
      case 4:
        // Level 4: 1111, 1112, etc.
        if (parentCode) {
          const prefix = parentCode.substring(0, 3);
          for (let i = 1; i <= 9; i++) {
            codes.push(`${prefix}${i}`);
          }
        }
        break;
    }
    
    return codes;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}