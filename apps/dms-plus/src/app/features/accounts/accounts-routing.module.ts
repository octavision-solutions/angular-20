import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'customers',
        loadComponent: () => import('./components/customers/customers.component').then((c) => c.CustomersComponent)
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./components/suppliers/suppliers.component').then((c) => c.SuppliersComponent)
      },
      {
        path: 'routes',
        loadComponent: () => import('./components/routes/routes.component').then((c) => c.RoutesComponent)
      },
      {
        path: 'salesman',
        loadComponent: () => import('./components/salesman/salesman.component').then((c) => c.SalesmanComponent)
      },
      {
        path: '',
        redirectTo: 'customers',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountsRoutingModule { }