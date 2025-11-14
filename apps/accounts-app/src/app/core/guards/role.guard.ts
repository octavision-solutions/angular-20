import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Role-based guard factory function
 */
export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.navigate(['/login']);
      return false;
    }

    if (allowedRoles.includes(currentUser.role)) {
      return true;
    }

    // Redirect to unauthorized page or dashboard
    router.navigate(['/dashboard']);
    return false;
  };
}

/**
 * Permission-based guard factory function
 */
export function permissionGuard(requiredPermissions: string[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const hasAllPermissions = requiredPermissions.every(permission => 
      authService.hasPermission(permission)
    );

    if (hasAllPermissions) {
      return true;
    }

    // Redirect to unauthorized page or dashboard
    router.navigate(['/dashboard']);
    return false;
  };
}

// Predefined role guards for common use cases
export const adminGuard = roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
export const accountantGuard = roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT]);
export const auditorGuard = roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.AUDITOR]);
export const viewerGuard = roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.AUDITOR, UserRole.VIEWER]);