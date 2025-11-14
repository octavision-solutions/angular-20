import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Route } from '../../../../core/models/database.models';
import { DatabaseService } from '../../../../core/services/database.service';

@Component({
  selector: 'app-routes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="feather icon-map-pin me-2"></i>
                Sales Routes
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Route Name</th>
                      <th>Description</th>
                      <th>Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="routes.length === 0">
                      <td colspan="4" class="text-center text-muted">No routes found</td>
                    </tr>
                    <tr *ngFor="let route of routes">
                      <td>{{ route.routename }}</td>
                      <td>{{ route.description || 'N/A' }}</td>
                      <td>
                        <span class="badge badge-success" *ngIf="route.routename !== '0'">Active</span>
                        <span class="badge badge-danger" *ngIf="route.routename === '0'">Inactive</span>
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
export class RoutesComponent implements OnInit {
  private db = inject(DatabaseService);
  
  routes: Route[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadRoutes();
  }

  async loadRoutes(): Promise<void> {
    try {
      await this.db.initializeDatabase();
      this.routes = await this.db.routes.toArray();
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  }
}