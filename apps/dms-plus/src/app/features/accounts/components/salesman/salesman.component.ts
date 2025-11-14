import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Salesman } from '../../../../core/models/database.models';
import { DatabaseService } from '../../../../core/services/database.service';

@Component({
  selector: 'app-salesman',
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
                Sales Team
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>ID</th>
                      <th>Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="salesTeam.length === 0">
                      <td colspan="6" class="text-center text-muted">No salesman found</td>
                    </tr>
                    <tr *ngFor="let salesman of salesTeam">
                      <td>{{ salesman.salesmanname }}</td>
                      <td>{{ salesman.salesmanid || 'N/A' }}</td>
                      <td>
                        <span class="badge bg-success" *ngIf="salesman.login_allowed">Active</span>
                        <span class="badge bg-secondary" *ngIf="!salesman.login_allowed">Inactive</span>
                      </td>
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
export class SalesmanComponent implements OnInit {
  private db = inject(DatabaseService);
  
  salesTeam: Salesman[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadSalesTeam();
  }

  async loadSalesTeam(): Promise<void> {
    try {
      await this.db.initializeDatabase();
      this.salesTeam = await this.db.salesman.toArray();
    } catch (error) {
      console.error('Error loading sales team:', error);
    }
  }
}