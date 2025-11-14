import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Account } from '../../../../core/models/database.models';
import { DatabaseService } from '../../../../core/services/database.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="feather icon-user-plus me-2"></i>
                Supplier Accounts
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
                      <th>Opening Balance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="suppliers.length === 0">
                      <td colspan="5" class="text-center text-muted">No suppliers found</td>
                    </tr>
                    <tr *ngFor="let supplier of suppliers">
                      <td>{{ supplier.account_name }}</td>
                      <td>{{ supplier.address || 'N/A' }}</td>
                      <td>{{ supplier.phone_no1 || 'N/A' }}</td>
                      <td>PKR {{ supplier.opening_balance | number:'1.2-2' }}</td>
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
export class SuppliersComponent implements OnInit {
  private db = inject(DatabaseService);
  
  suppliers: Account[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadSuppliers();
  }

  async loadSuppliers(): Promise<void> {
    try {
      await this.db.initializeDatabase();
      this.suppliers = await this.db.accounts.where('acct_type').equals('supplier').toArray();
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  }
}