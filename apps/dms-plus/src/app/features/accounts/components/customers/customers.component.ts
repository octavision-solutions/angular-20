import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Account } from '../../../../core/models/database.models';
import { DatabaseService } from '../../../../core/services/database.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="feather icon-users me-2"></i>
                Customer Accounts
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Account Name</th>
                      <th>Address</th>
                      <th>Phone</th>
                      <th>Credit Limit</th>
                      <th>Opening Balance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="customers.length === 0">
                      <td colspan="6" class="text-center text-muted">No customers found</td>
                    </tr>
                    <tr *ngFor="let customer of customers">
                      <td>{{ customer.account_name }}</td>
                      <td>{{ customer.address || 'N/A' }}</td>
                      <td>{{ customer.phone_no1 || 'N/A' }}</td>
                      <td>PKR {{ customer.credit_limit | number:'1.2-2' }}</td>
                      <td>PKR {{ customer.opening_balance | number:'1.2-2' }}</td>
                      <td>
                        <button class="btn btn-sm btn-primary">Edit</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomersComponent implements OnInit {
  private db = inject(DatabaseService);
  
  customers: Account[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadCustomers();
  }

  async loadCustomers(): Promise<void> {
    try {
      await this.db.initializeDatabase();
      this.customers = await this.db.accounts.where('acct_type').equals('customer').toArray();
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }
}