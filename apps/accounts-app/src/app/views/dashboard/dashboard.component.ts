import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule, ButtonModule, GridModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';

@Component({
  selector: 'acc-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    GridModule,
    IconModule
  ],
  template: `
    <c-container>
      <c-row>
        <c-col xs="12">
          <c-card>
            <c-card-header>
              <h4 class="mb-0">Dashboard</h4>
            </c-card-header>
            <c-card-body>
              <h5>Welcome to the Accounting System</h5>
              <p>Use the navigation menu to access different accounting modules:</p>
              <ul>
                <li><strong>Chart of Accounts</strong> - Manage your account structure</li>
                <li><strong>Journal Vouchers</strong> - Record transactions (Coming Soon)</li>
                <li><strong>General Ledger</strong> - View account balances and transactions (Coming Soon)</li>
                <li><strong>Financial Reports</strong> - Generate financial statements (Coming Soon)</li>
              </ul>
              
              <div class="mt-4">
                <a routerLink="/accounting/chart-of-accounts" cButton color="primary">
                  <svg cIcon name="cil-list"></svg>
                  Go to Chart of Accounts
                </a>
              </div>
            </c-card-body>
          </c-card>
        </c-col>
      </c-row>
    </c-container>
  `,
  styles: [`
    .mt-4 {
      margin-top: 1.5rem;
    }
  `]
})
export class DashboardComponent {
}
