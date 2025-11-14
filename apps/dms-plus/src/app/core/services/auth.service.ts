import { Injectable, inject } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from './database.service';

export interface AuthUser {
  salesmanid: number;
  salesmanname: string;
  username: string;
  routes: number[];
  isAuthenticated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Using modern inject() function instead of constructor injection
  private db = inject(DatabaseService);

  constructor() {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    const savedUser = localStorage.getItem('dms_current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error loading saved user:', error);
        localStorage.removeItem('dms_current_user');
      }
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; message: string; user?: AuthUser }> {
    try {
      // Ensure database is open
      await this.db.open();
      
      const hashedPassword = this.hashPassword(password);
      
      const salesman = await this.db.salesman
        .where('username')
        .equals(username)
        .and(s => s.login_allowed === true)
        .first();

      if (!salesman) {
        return { success: false, message: 'Invalid username or password' };
      }

      // In a real application, compare with hashed password
      if (salesman.password !== password && salesman.password !== hashedPassword) {
        return { success: false, message: 'Invalid username or password' };
      }

      // Get assigned routes
      const salesmanRoutes = await this.db.salesmanRoutes
        .where('salesmanid')
        .equals(salesman.salesmanid!)
        .and(sr => sr.is_active === true)
        .toArray();

      const user: AuthUser = {
        salesmanid: salesman.salesmanid!,
        salesmanname: salesman.salesmanname,
        username: salesman.username!,
        routes: salesmanRoutes.map(sr => sr.routeid),
        isAuthenticated: true
      };

      this.currentUserSubject.next(user);
      localStorage.setItem('dms_current_user', JSON.stringify(user));

      // Log login activity
      await this.db.addToSyncQueue('auth_logs', user.salesmanid, 'insert', {
        action: 'login',
        timestamp: new Date(),
        salesmanid: user.salesmanid
      });

      return { success: true, message: 'Login successful', user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  async logout(): Promise<void> {
    const currentUser = this.currentUserSubject.value;
    
    if (currentUser) {
      // Log logout activity
      await this.db.addToSyncQueue('auth_logs', currentUser.salesmanid, 'insert', {
        action: 'logout',
        timestamp: new Date(),
        salesmanid: currentUser.salesmanid
      });
    }

    this.currentUserSubject.next(null);
    localStorage.removeItem('dms_current_user');
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    return user !== null && user.isAuthenticated;
  }

  hasRouteAccess(routeid: number): boolean {
    const user = this.getCurrentUser();
    return user !== null && user.routes.includes(routeid);
  }

  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'Not authenticated' };
      }

      const salesman = await this.db.salesman.get(currentUser.salesmanid);
      if (!salesman) {
        return { success: false, message: 'User not found' };
      }

      const hashedOldPassword = this.hashPassword(oldPassword);
      if (salesman.password !== oldPassword && salesman.password !== hashedOldPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      const hashedNewPassword = this.hashPassword(newPassword);
      await this.db.salesman.update(currentUser.salesmanid, {
        password: hashedNewPassword
      });

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, message: 'Failed to change password' };
    }
  }
}