import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService, AuthUser } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent {
  private authService = inject(AuthService);
  currentUser: AuthUser | null = null;

  constructor() {
    this.currentUser = this.authService.getCurrentUser();
    this.authService.currentUser$.subscribe(u => (this.currentUser = u));
  }
}
