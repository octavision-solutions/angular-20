import { Injectable } from '@angular/core';

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
export class StubAuthService {
  getCurrentUser(): AuthUser | null {
    return {
      salesmanid: 1,
      salesmanname: 'Admin User',
      username: 'admin',
      routes: [],
      isAuthenticated: true
    };
  }

  async login(username: string, password: string) {
    return { success: true, message: 'Stub login successful' };
  }

  logout() {
    console.log('Stub: logout called');
  }
}