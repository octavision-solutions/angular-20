import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'daily-sales',
    loadComponent: () => import('./components/daily-sales/daily-sales.component').then(m => m.DailySalesComponent)
  },
  {
    path: '',
    redirectTo: 'daily-sales',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }