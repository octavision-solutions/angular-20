import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'sale',
    pathMatch: 'full'
  },
  {
    path: 'sale',
    loadComponent: () => import('./components/sale/sale.component').then(c => c.SaleComponent)
  },
  {
    path: 'sale-return',
    loadComponent: () => import('./components/sale-return/sale-return.component').then(c => c.SaleReturnComponent)
  },
  {
    path: 'purchase',
    loadComponent: () => import('./components/purchase/purchase.component').then(c => c.PurchaseComponent)
  },
  {
    path: 'purchase-return',
    loadComponent: () => import('./components/purchase-return/purchase-return.component').then(c => c.PurchaseReturnComponent)
  },
  {
    path: 'audit',
    loadComponent: () => import('./components/audit/audit.component').then(c => c.AuditComponent)
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class TransactionsModule { }