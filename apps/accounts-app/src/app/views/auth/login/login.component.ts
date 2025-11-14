import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  CardModule,
  FormModule,
  ButtonModule,
  AlertModule,
  SpinnerModule,
  GridModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import {
  AuthService,
  LoginCredentials,
} from '../../../core/services/auth.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'acc-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    FormModule,
    ButtonModule,
    AlertModule,
    SpinnerModule,
    GridModule,
    IconModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm!: FormGroup;
  loading = false;
  error = '';
  returnUrl = '';

  // Demo credentials for easy testing
  demoCredentials = [
    { username: 'admin@123456', password: 'admin123', role: 'Admin' },
    {
      username: 'accountant@123456',
      password: 'account123',
      role: 'Accountant',
    },
    { username: 'auditor@123456', password: 'audit123', role: 'Auditor' },
    { username: 'viewer@123456', password: 'view123', role: 'Viewer' },
  ];

  ngOnInit(): void {
    this.initializeForm();

    // Get return url from route parameters or default to dashboard
    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      username: [
        '',
        [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+@\d{6}$/)],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const credentials: LoginCredentials = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password,
    };


    this.authService
      .login(credentials)
      .pipe(
        catchError((error) => {
          this.error = error.message || 'Login failed. Please try again.';
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((response) => {
        if (response) {
          // Successful login
          console.log('Login successful, navigating to:', this.returnUrl);
          console.log('Auth service authenticated:', this.authService.isAuthenticated());
          console.log('Current user:', this.authService.getCurrentUser());
          this.router.navigate([this.returnUrl]);
        }
      });
  }

  useDemoCredentials(credentials: {
    username: string;
    password: string;
  }): void {
    this.loginForm.patchValue({
      username: credentials.username,
      password: credentials.password,
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['pattern']) {
        return 'Username must be in format: username@tenantid (e.g., admin@123456)';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${
          field.errors['minlength'].requiredLength
        } characters`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      username: 'Username',
      password: 'Password',
    };
    return labels[fieldName] || fieldName;
  }
}
