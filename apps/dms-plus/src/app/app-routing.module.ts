import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

// project import
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';

const routes: Routes = [
  {
    path: '',
  component: AdminComponent,
  canActivate: [AuthGuard],
  canActivateChild: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/components/dashboard/dashboard.component').then((c) => c.DashboardComponent)
      },
      {
        path: 'transactions',
        loadChildren: () => import('./features/transactions/transactions.module').then((m) => m.TransactionsModule)
      },
      {
        path: 'cash',
        loadChildren: () => import('./features/cash-management/cash-management-routing.module').then((m) => m.CashManagementRoutingModule)
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory.module').then((m) => m.InventoryModule)
      },
      {
        path: 'accounts',
        loadChildren: () => import('./features/accounts/accounts.module').then((m) => m.AccountsModule)
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.module').then((m) => m.ReportsModule)
      },
      {
        path: 'admin/database',
        loadComponent: () => import('./features/admin/components/database-viewer/database-viewer.component').then((c) => c.DatabaseViewerComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then((c) => c.ProfileComponent)
      },
      // Keep legacy demo routes for development reference
      {
        path: 'demo',
        children: [
          {
            path: 'sample-page',
            loadComponent: () => import('./pages/extra/sample-page/sample-page.component').then((c) => c.SamplePageComponent)
          }
        ]
      }
    ]
  },
  {
    path: '',
    component: GuestComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/components/login/login.component').then((c) => c.LoginComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
