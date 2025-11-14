import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'cash-receipt',
    pathMatch: 'full'
  },
  {
    path: 'recovery',
    loadComponent: () => 
      import('./components/recovery/recovery.component').then(m => m.RecoveryComponent),
    title: 'Recovery Management - DMS+'
  },
  {
    path: 'cash-receipt',
    loadComponent: () => 
      import('./components/cash-receipt/cash-receipt.component').then(m => m.CashReceiptComponent),
    title: 'Cash Receipt - DMS+'
  },
  {
    path: 'cash-payment',
    loadComponent: () => 
      import('./components/cash-payment/cash-payment.component').then(m => m.CashPaymentComponent),
    title: 'Cash Payment - DMS+'
  },
  {
    path: 'expense',
    loadComponent: () => 
      import('./components/expense/expense.component').then(m => m.ExpenseComponent),
    title: 'Business Expenses - DMS+'
  }
  // Additional routes will be added as we create more components
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CashManagementRoutingModule { }