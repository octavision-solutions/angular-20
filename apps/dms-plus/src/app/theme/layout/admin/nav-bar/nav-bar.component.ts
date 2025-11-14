// angular import
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

// services
import { AuthService, AuthUser } from '../../../../core/services/auth.service';

// project import
import { SharedModule } from '../../../../theme/shared/shared.module';
// nav-left and nav-right removed from simplified header

@Component({
  selector: 'app-nav-bar',
  imports: [SharedModule, RouterModule, CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {
  // public props
  readonly NavCollapsedMob = output();
  navCollapsedMob;
  headerStyle: string;
  menuClass: boolean;
  collapseStyle: string;

  // constructor
  constructor() {
    this.navCollapsedMob = false;
    this.headerStyle = '';
    this.menuClass = false;
    this.collapseStyle = 'none';
  }

  // inject services for logout/profile
  private authService = inject(AuthService);
  private router = inject(Router);
  currentUser: AuthUser | null = null;
  menuOpen = false;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // subscribe to changes
    this.authService.currentUser$.subscribe(user => (this.currentUser = user));
  }

  // Navigate to a simple profile page (if exists) or to the login page
  goProfile(): void {
    this.menuOpen = false;
    // if there is a profile route, navigate there; otherwise open dashboard
    this.router.navigateByUrl('/profile').catch(() => this.router.navigateByUrl('/dashboard/default'));
  }

  async logout(): Promise<void> {
    this.menuOpen = false;
    try {
      await this.authService.logout();
    } catch (err) {
      console.warn('Error during logout:', err);
    }
    // Redirect to signin page
    this.router.navigateByUrl('/auth/signin').catch(() => this.router.navigateByUrl('/'));
  }

  // public method
  toggleMobOption() {
    this.menuClass = !this.menuClass;
    this.headerStyle = this.menuClass ? 'none' : '';
    this.collapseStyle = this.menuClass ? 'block' : 'none';
  }

  // this is for eslint rule
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }

  closeMenu() {
    if (document.querySelector('app-navigation.pcoded-navbar')?.classList.contains('mob-open')) {
      document.querySelector('app-navigation.pcoded-navbar')?.classList.remove('mob-open');
    }
  }
}
