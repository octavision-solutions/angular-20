import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Company, Product } from '../../../../core/models/database.models';
import { AuthService } from '../../../../core/services/auth.service';
import { DatabaseService } from '../../../../core/services/database.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="feather icon-package me-2"></i>
                Products Management
              </h5>
              <div class="d-flex gap-2">
                <button 
                  class="btn btn-sm btn-outline-success"
                  (click)="exportData()"
                  [disabled]="isLoading">
                  <i class="feather icon-download me-1"></i>
                  Export CSV
                </button>
                <button 
                  class="btn btn-sm btn-primary"
                  (click)="showAddForm()">
                  <i class="feather icon-plus me-1"></i>
                  Add Product
                </button>
              </div>
            </div>

            <div class="card-body">
              <!-- Add/Edit Form -->
              <div class="row" *ngIf="showForm">
                <div class="col-md-12">
                  <div class="alert alert-info">
                    <h6>{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h6>
                    <form [formGroup]="productForm" (ngSubmit)="saveProduct()">
                      <div class="row">
                        <div class="col-md-3">
                          <div class="mb-3">
                            <label class="form-label">Product Code *</label>
                            <input 
                              type="text" 
                              class="form-control" 
                              formControlName="code"
                              placeholder="Enter product code">
                            <div class="invalid-feedback" *ngIf="productForm.get('code')?.invalid && productForm.get('code')?.touched">
                              Product code is required
                            </div>
                          </div>
                        </div>
                        <div class="col-md-3">
                          <div class="mb-3">
                            <label class="form-label">Product Name *</label>
                            <input 
                              type="text" 
                              class="form-control" 
                              formControlName="product_name"
                              placeholder="Enter product name">
                            <div class="invalid-feedback" *ngIf="productForm.get('product_name')?.invalid && productForm.get('product_name')?.touched">
                              Product name is required
                            </div>
                          </div>
                        </div>
                        <div class="col-md-2">
                          <div class="mb-3">
                            <label class="form-label">Company *</label>
                            <select class="form-select" formControlName="companyid">
                              <option value="">Select Company</option>
                              <option *ngFor="let company of companies" [value]="company.companyid">
                                {{company.companyname}}
                              </option>
                            </select>
                            <div class="invalid-feedback" *ngIf="productForm.get('companyid')?.invalid && productForm.get('companyid')?.touched">
                              Company is required
                            </div>
                          </div>
                        </div>
                        <div class="col-md-2">
                          <div class="mb-3">
                            <label class="form-label">Units in Pack *</label>
                            <input 
                              type="number" 
                              class="form-control" 
                              formControlName="units_in_pack"
                              placeholder="1">
                            <div class="invalid-feedback" *ngIf="productForm.get('units_in_pack')?.invalid && productForm.get('units_in_pack')?.touched">
                              Units in pack is required
                            </div>
                          </div>
                        </div>
                        <div class="col-md-2">
                          <div class="mb-3">
                            <label class="form-label">Sale Price *</label>
                            <input 
                              type="number" 
                              class="form-control" 
                              formControlName="sprice"
                              step="0.01"
                              placeholder="0.00">
                            <div class="invalid-feedback" *ngIf="productForm.get('sprice')?.invalid && productForm.get('sprice')?.touched">
                              Sale price is required
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-md-2">
                          <div class="mb-3">
                            <label class="form-label">Status</label>
                            <select class="form-select" formControlName="statusid">
                              <option value="1">Active</option>
                              <option value="0">Inactive</option>
                            </select>
                          </div>
                        </div>
                        <div class="col-md-10 d-flex align-items-end">
                          <div class="mb-3">
                            <button 
                              type="submit" 
                              class="btn btn-primary me-2"
                              [disabled]="productForm.invalid || isProcessing">
                              <i class="feather icon-save me-1"></i>
                              {{ isProcessing ? 'Saving...' : 'Save' }}
                            </button>
                            <button 
                              type="button" 
                              class="btn btn-secondary"
                              (click)="hideForm()">
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <!-- Search and Filters -->
              <div class="row mb-3">
                <div class="col-md-6">
                  <div class="input-group">
                    <span class="input-group-text">
                      <i class="feather icon-search"></i>
                    </span>
                    <input 
                      type="text" 
                      class="form-control" 
                      placeholder="Search products..."
                      [(ngModel)]="searchTerm"
                      (input)="filterProducts()">
                  </div>
                </div>
                <div class="col-md-3">
                  <select class="form-select" [(ngModel)]="filterStatus" (change)="filterProducts()">
                    <option value="">All Status</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <select class="form-select" [(ngModel)]="filterCompany" (change)="filterProducts()">
                    <option value="">All Companies</option>
                    <option *ngFor="let company of companies" [value]="company.companyid">
                      {{company.companyname}}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Products Table -->
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th>Code</th>
                      <th>Product Name</th>
                      <th>Company</th>
                      <th>Units in Pack</th>
                      <th>Sale Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="isLoading">
                      <td colspan="7" class="text-center">
                        <div class="spinner-border text-primary" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                    <tr *ngIf="!isLoading && filteredProducts.length === 0">
                      <td colspan="7" class="text-center text-muted">No products found</td>
                    </tr>
                    <tr *ngFor="let product of filteredProducts; trackBy: trackByProductId">
                      <td>{{ product.code }}</td>
                      <td>{{ product.product_name }}</td>
                      <td>{{ getCompanyName(product.companyid) }}</td>
                      <td>{{ product.units_in_pack }}</td>
                      <td>PKR {{ product.sprice | number:'1.2-2' }}</td>
                      <td>
                        <span 
                          class="badge"
                          [ngClass]="product.statusid === 1 ? 'bg-success' : 'bg-secondary'">
                          {{ product.statusid === 1 ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button 
                            class="btn btn-outline-primary"
                            (click)="editProduct(product)"
                            title="Edit">
                            <i class="feather icon-edit"></i>
                          </button>
                          <button 
                            class="btn btn-outline-danger"
                            (click)="deleteProduct(product)"
                            [disabled]="isProcessing"
                            title="Delete">
                            <i class="feather icon-trash-2"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Summary -->
              <div class="row mt-3">
                <div class="col-md-12">
                  <div class="alert alert-light">
                    <div class="row">
                      <div class="col-md-4">
                        <strong>Total Products:</strong> {{ products.length }}
                      </div>
                      <div class="col-md-4">
                        <strong>Active:</strong> {{ getActiveCount() }}
                      </div>
                      <div class="col-md-4">
                        <strong>Inactive:</strong> {{ getInactiveCount() }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private db = inject(DatabaseService);
  private authService = inject(AuthService);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  companies: Company[] = [];
  
  productForm!: FormGroup;
  showForm = false;
  isEditing = false;
  isLoading = false;
  isProcessing = false;
  
  searchTerm = '';
  filterStatus = '';
  filterCompany = '';
  
  currentEditId?: number;

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  initializeForm(): void {
    this.productForm = this.fb.group({
      code: ['', [Validators.required]],
      product_name: ['', [Validators.required]],
      companyid: ['', [Validators.required]],
      units_in_pack: [1, [Validators.required, Validators.min(1)]],
      sprice: [0, [Validators.required, Validators.min(0)]],
      statusid: [1, [Validators.required]]
    });
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      await this.db.initializeDatabase();
      [this.products, this.companies] = await Promise.all([
        this.db.products.orderBy('product_name').toArray(),
        this.db.companies.orderBy('companyname').toArray()
      ]);
      this.filterProducts();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  filterProducts(): void {
    let filtered = [...this.products];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        (p.code ?? '').toLowerCase().includes(term) ||
        p.product_name.toLowerCase().includes(term)
      );
    }

    if (this.filterStatus !== '') {
      filtered = filtered.filter(p => p.statusid.toString() === this.filterStatus);
    }

    if (this.filterCompany) {
      filtered = filtered.filter(p => p.companyid.toString() === this.filterCompany);
    }

    this.filteredProducts = filtered;
  }

  showAddForm(): void {
    this.showForm = true;
    this.isEditing = false;
    this.productForm.reset();
    this.productForm.patchValue({ statusid: 1 });
  }

  editProduct(product: Product): void {
    this.showForm = true;
    this.isEditing = true;
    this.currentEditId = product.productid;
    this.productForm.patchValue(product);
  }

  hideForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.currentEditId = undefined;
    this.productForm.reset();
  }

  async saveProduct(): Promise<void> {
    if (this.productForm.valid) {
      this.isProcessing = true;
      try {
        const formData = this.productForm.value;
        const productData: Product = {
          ...formData,
          units_in_pack: parseInt(formData.units_in_pack),
          sprice: parseFloat(formData.sprice),
          companyid: parseInt(formData.companyid),
          statusid: parseInt(formData.statusid)
        };

        if (this.isEditing && this.currentEditId) {
          productData.productid = this.currentEditId;
          productData.updated_at = new Date();
          await this.db.products.update(this.currentEditId, productData);
        } else {
          productData.created_at = new Date();
          productData.updated_at = new Date();
          await this.db.products.add(productData);
        }

        await this.loadData();
        this.hideForm();
      } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product. Please try again.');
      } finally {
        this.isProcessing = false;
      }
    }
  }

  async deleteProduct(product: Product): Promise<void> {
    if (confirm(`Are you sure you want to delete "${product.product_name}"?`)) {
      this.isProcessing = true;
      try {
        if (product.productid != null) {
          await this.db.products.delete(product.productid);
        }
        await this.loadData();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
      } finally {
        this.isProcessing = false;
      }
    }
  }

  async exportData(): Promise<void> {
    try {
      const csvData = this.products.map(product => ({
        Code: product.code ?? '',
        'Product Name': product.product_name,
        Company: this.getCompanyName(product.companyid),
        'Units in Pack': product.units_in_pack,
        'Sale Price': product.sprice,
        Status: product.statusid === 1 ? 'Active' : 'Inactive'
      }));

      const csv = this.convertToCSV(csvData);
      this.downloadCSV(csv, 'products.csv');
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  }

  getCompanyName(companyId: number): string {
    const company = this.companies.find(c => c.companyid === companyId);
    return company ? company.companyname : 'Unknown';
  }

  getActiveCount(): number {
    return this.products.filter(p => p.statusid === 1).length;
  }

  getInactiveCount(): number {
    return this.products.filter(p => p.statusid === 0).length;
  }

  trackByProductId(index: number, item: Product): number {
    return item.productid || index;
  }

  private convertToCSV(data: Record<string, string | number>[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(value => `"${value}"`).join(',')
    ).join('\n');
    
    return headers + '\n' + rows;
  }

  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}