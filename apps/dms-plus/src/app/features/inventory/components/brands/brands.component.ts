import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="feather icon-tag me-2"></i>
                Brands Management
              </h5>
            </div>
            <div class="card-body">
              <div class="alert alert-info">
                <p class="mb-0">This section is for managing product brands and categories. Feature under development.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BrandsComponent { }