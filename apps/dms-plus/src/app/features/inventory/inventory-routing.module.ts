import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'products',
        loadComponent: () => import('./components/products/products.component').then((c) => c.ProductsComponent)
      },
      {
        path: 'companies',
        loadComponent: () => import('./components/companies/companies.component').then((c) => c.CompaniesComponent)
      },
      {
        path: 'brands',
        loadComponent: () => import('./components/brands/brands.component').then((c) => c.BrandsComponent)
      },
      {
        path: 'stock-balance',
        loadComponent: () => import('./components/stock-balance/stock-balance.component').then((c) => c.StockBalanceComponent)
      },
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule { }