import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap, delay } from 'rxjs/operators';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: number;
  tenantName: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
}

export interface Tenant {
  id: number;
  name: string;
  displayName: string;
  currency: string;
  timezone: string;
  fiscalYearStart: string;
  isActive: boolean;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  ACCOUNTANT = 'accountant',
  AUDITOR = 'auditor',
  VIEWER = 'viewer'
}

export interface LoginCredentials {
  username: string;  // Changed from email to username to match backend format
  password: string;
  tenantId?: string;  // Changed to string for 6-digit tenant ID
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: {
      id: number;
      username: string;
      full_name: string;
      email: string;
      role: string;
      tenant_id: string;
    };
  };
}

export interface RegisterRequest {
  company_name: string;
  admin_username: string;
  admin_password: string;
  admin_email: string;
  admin_full_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = 'http://localhost:8080/api/v1';
  private readonly TOKEN_KEY = 'accounts_app_token';
  private readonly REFRESH_TOKEN_KEY = 'accounts_app_refresh_token';
  private readonly USER_KEY = 'accounts_app_user';
  private readonly TENANT_KEY = 'accounts_app_tenant';

  private httpClient = inject(HttpClient);
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  private currentTenantSubject = new BehaviorSubject<Tenant | null>(this.getTenantFromStorage());

  public currentUser$ = this.currentUserSubject.asObservable();
  public currentTenant$ = this.currentTenantSubject.asObservable();

  constructor() {
    // Initialize from localStorage on service creation
    this.initializeFromStorage();
  }

  /**
   * Login with username@tenantid and password
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const loginData = {
      username: credentials.username,
      password: credentials.password
    };

    return this.httpClient.post<AuthResponse>(`${this.API_BASE_URL}/auth/login`, loginData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response);
        }
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Register new user and tenant
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.httpClient.post<AuthResponse>(`${this.API_BASE_URL}/auth/register`, request).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Registration successful - user can now login
          console.log('Registration successful:', response);
        }
      }),
      catchError(error => {
        console.error('Registration failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout current user
   */
  logout(): Observable<boolean> {
    return of(true).pipe(
      delay(100), // Simulate API call
      tap(() => {
        this.clearSession();
      })
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get current tenant
   */
  getCurrentTenant(): Tenant | null {
    return this.currentTenantSubject.value;
  }

  /**
   * Check if current user has specific role
   */
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if current user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const refreshData = { refresh_token: refreshToken };

    return this.httpClient.post<AuthResponse>(`${this.API_BASE_URL}/auth/refresh`, refreshData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response);
        }
      }),
      catchError(error => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  /**
   * Switch tenant (for multi-tenant users)
   */
  switchTenant(_tenantId: number): Observable<AuthResponse> {
    // TODO: Implement real API call for tenant switching
    // For now, return an error since this feature is not implemented in the backend
    return throwError(() => new Error('Tenant switching not yet implemented in backend'));
  }

  private setSession(authResponse: AuthResponse): void {
    if (authResponse.success && authResponse.data) {
      localStorage.setItem(this.TOKEN_KEY, authResponse.data.access_token);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, authResponse.data.refresh_token);
      
      // Convert backend user format to frontend User interface
      const user: User = {
        id: authResponse.data.user.id,
        email: authResponse.data.user.email,
        firstName: authResponse.data.user.full_name.split(' ')[0] || '',
        lastName: authResponse.data.user.full_name.split(' ').slice(1).join(' ') || '',
        role: this.mapBackendRole(authResponse.data.user.role),
        tenantId: parseInt(authResponse.data.user.tenant_id),
        tenantName: `Tenant ${authResponse.data.user.tenant_id}`,
        permissions: this.getRolePermissions(this.mapBackendRole(authResponse.data.user.role)),
        isActive: true,
        lastLogin: new Date()
      };

      const tenant: Tenant = {
        id: parseInt(authResponse.data.user.tenant_id),
        name: `tenant_${authResponse.data.user.tenant_id}`,
        displayName: `Tenant ${authResponse.data.user.tenant_id}`,
        currency: 'USD',
        timezone: 'UTC',
        fiscalYearStart: '01-01',
        isActive: true
      };

      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.TENANT_KEY, JSON.stringify(tenant));
      
      this.currentUserSubject.next(user);
      this.currentTenantSubject.next(tenant);
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TENANT_KEY);
    
    this.currentUserSubject.next(null);
    this.currentTenantSubject.next(null);
  }

  private initializeFromStorage(): void {
    const user = this.getUserFromStorage();
    const tenant = this.getTenantFromStorage();
    
    if (user && tenant && this.isAuthenticated()) {
      this.currentUserSubject.next(user);
      this.currentTenantSubject.next(tenant);
    } else {
      this.clearSession();
    }
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private getTenantFromStorage(): Tenant | null {
    const tenantJson = localStorage.getItem(this.TENANT_KEY);
    return tenantJson ? JSON.parse(tenantJson) : null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      // Handle demo tokens (they start with "demo_token_")
      if (token.startsWith('demo_token_')) {
        // Demo tokens are valid for 1 hour from creation
        const timestamp = parseInt(token.split('_')[2]);
        const tokenAgeHours = (Date.now() / 1000 - timestamp) / 3600;
        return tokenAgeHours > 1; // Expire after 1 hour
      }
      
      // Handle real JWT tokens
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  private mapBackendRole(backendRole: string): UserRole {
    const roleMap: Record<string, UserRole> = {
      'super_admin': UserRole.SUPER_ADMIN,
      'admin': UserRole.ADMIN,
      'accountant': UserRole.ACCOUNTANT,
      'auditor': UserRole.AUDITOR,
      'viewer': UserRole.VIEWER
    };
    return roleMap[backendRole] || UserRole.VIEWER;
  }

  private getRolePermissions(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      [UserRole.SUPER_ADMIN]: [
        'system.manage', 'tenant.manage', 'user.manage', 'account.manage', 
        'transaction.manage', 'report.view', 'report.export', 'backup.manage'
      ],
      [UserRole.ADMIN]: [
        'tenant.manage', 'user.manage', 'account.manage', 'transaction.manage', 
        'report.view', 'report.export', 'settings.manage'
      ],
      [UserRole.ACCOUNTANT]: [
        'account.manage', 'transaction.manage', 'voucher.manage', 
        'report.view', 'report.export'
      ],
      [UserRole.AUDITOR]: [
        'account.view', 'transaction.view', 'voucher.view', 
        'report.view', 'report.export', 'audit.manage'
      ],
      [UserRole.VIEWER]: [
        'account.view', 'transaction.view', 'report.view'
      ]
    };
    return permissions[role] || [];
  }
}