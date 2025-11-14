import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { accountantGuard } from './core/guards/role.guard';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./views/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
    data: {
      title: 'Login'
    }
  },
  {
    path: '',
    loadComponent: () => import('./layout').then(m => m.DefaultLayoutComponent),
    canActivate: [authGuard],
    data: {
      title: 'Home'
    },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./views/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { title: 'Dashboard' }
      },
      {
        path: 'accounting',
        data: { title: 'Accounting' },
        canActivate: [accountantGuard],
        children: [
          {
            path: 'chart-of-accounts',
            data: { title: 'Chart of Accounts' },
            loadComponent: () => import('./views/accounting/chart-of-accounts/chart-of-accounts.component').then(m => m.ChartOfAccountsComponent)
          }
        ]
      }
    ]
  },
  {
    path: '404',
    loadComponent: () => import('./views/pages/page404/page404.component').then(m => m.Page404Component),
    data: {
      title: 'Page 404'
    }
  },
  { path: '**', redirectTo: '404' }
];
