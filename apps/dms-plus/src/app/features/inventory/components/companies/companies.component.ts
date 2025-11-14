import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Company } from '../../../../core/models/database.models';
import { DatabaseService } from '../../../../core/services/database.service';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="feather icon-briefcase me-2"></i>
                Companies Management
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Company Name</th>
                      <th>Address</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="companies.length === 0">
                      <td colspan="5" class="text-center text-muted">No companies found</td>
                    </tr>
                    <tr *ngFor="let company of companies">
                      <td>{{ company.companyid }}</td>
                      <td>{{ company.companyname }}</td>
                      <td>{{ company.address || 'N/A' }}</td>
                      <td>{{ company.phone || 'N/A' }}</td>
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
export class CompaniesComponent implements OnInit {
  private db = inject(DatabaseService);
  
  companies: Company[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadCompanies();
  }

  async loadCompanies(): Promise<void> {
    try {
      await this.db.initializeDatabase();
      this.companies = await this.db.companies.toArray();
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }
}