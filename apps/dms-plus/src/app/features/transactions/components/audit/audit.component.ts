import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Product } from '../../../../core/models/database.models';
import { AuthService } from '../../../../core/services/auth.service';
import { DatabaseService } from '../../../../core/services/database.service';

interface StockAuditItem {
  productId: number;
  productName: string;
  currentStock: number;
  auditedStock: number;
  difference: number;
  adjustmentType: 'increase' | 'decrease' | 'none';
  reason: string;
}

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss']
})
export class AuditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private db = inject(DatabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  auditForm!: FormGroup;
  products: Product[] = [];
  stockAuditItems: StockAuditItem[] = [];
  isLoading = false;
  isLoadingStock = false;
  currentUser: {salesmanid: number, salesmanname: string} | null = null;

  // Audit reasons
  adjustmentReasons = [
    'Physical count difference',
    'Damaged stock',
    'Expired products',
    'Theft/Loss',
    'System error correction',
    'Transfer adjustment',
    'Opening balance correction',
    'Other'
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
    this.loadCurrentUser();
  }

  private initializeForm(): void {
    this.auditForm = this.fb.group({
      auditDate: [new Date().toISOString().split('T')[0], Validators.required],
      auditType: ['full', Validators.required],
      selectedProductIds: [[]],
      notes: [''],
      items: this.fb.array([])
    });
  }

  get itemsArray(): FormArray {
    return this.auditForm.get('items') as FormArray;
  }

  private createAuditItemFormGroup(item: StockAuditItem): FormGroup {
    return this.fb.group({
      productId: [item.productId, Validators.required],
      productName: [item.productName],
      currentStock: [item.currentStock],
      auditedStock: [item.auditedStock, [Validators.required, Validators.min(0)]],
      difference: [{value: item.difference, disabled: true}],
      adjustmentType: [{value: item.adjustmentType, disabled: true}],
      reason: [item.reason, item.adjustmentType !== 'none' ? Validators.required : null]
    });
  }

  async onAuditTypeChange(): Promise<void> {
    const auditType = this.auditForm.get('auditType')?.value;
    
    if (auditType === 'full') {
      await this.loadFullStockAudit();
    } else {
      this.stockAuditItems = [];
      this.clearItemsArray();
    }
  }

  async onSelectedProductsChange(): Promise<void> {
    const auditType = this.auditForm.get('auditType')?.value;
    const selectedProductIds = this.auditForm.get('selectedProductIds')?.value || [];
    
    if (auditType === 'selective' && selectedProductIds.length > 0) {
      await this.loadSelectiveStockAudit(selectedProductIds);
    }
  }

  private async loadFullStockAudit(): Promise<void> {
    this.isLoadingStock = true;
    try {
      this.stockAuditItems = [];
      
      for (const product of this.products) {
        const currentStock = await this.calculateCurrentStock(product.productid!);
        
        const auditItem: StockAuditItem = {
          productId: product.productid!,
          productName: product.product_name,
          currentStock,
          auditedStock: currentStock,
          difference: 0,
          adjustmentType: 'none',
          reason: ''
        };
        
        this.stockAuditItems.push(auditItem);
      }
      
      this.populateAuditItems();
    } catch (error) {
      console.error('Error loading full stock audit:', error);
      alert('Error loading stock data. Please try again.');
    } finally {
      this.isLoadingStock = false;
    }
  }

  private async loadSelectiveStockAudit(productIds: number[]): Promise<void> {
    this.isLoadingStock = true;
    try {
      this.stockAuditItems = [];
      
      for (const productId of productIds) {
        const product = this.products.find(p => p.productid === productId);
        if (!product) continue;
        
        const currentStock = await this.calculateCurrentStock(productId);
        
        const auditItem: StockAuditItem = {
          productId: productId,
          productName: product.product_name,
          currentStock,
          auditedStock: currentStock,
          difference: 0,
          adjustmentType: 'none',
          reason: ''
        };
        
        this.stockAuditItems.push(auditItem);
      }
      
      this.populateAuditItems();
    } catch (error) {
      console.error('Error loading selective stock audit:', error);
      alert('Error loading stock data. Please try again.');
    } finally {
      this.isLoadingStock = false;
    }
  }

  private async calculateCurrentStock(productId: number): Promise<number> {
    const stockRecords = await this.db.stock
      .where('productid')
      .equals(productId)
      .toArray();
    
    return stockRecords.reduce((total, stock) => total + stock.qty, 0);
  }

  private populateAuditItems(): void {
    this.clearItemsArray();
    
    this.stockAuditItems.forEach(item => {
      const formGroup = this.createAuditItemFormGroup(item);
      this.itemsArray.push(formGroup);
    });
  }

  private clearItemsArray(): void {
    while (this.itemsArray.length !== 0) {
      this.itemsArray.removeAt(0);
    }
  }

  onAuditedStockChange(index: number): void {
    const item = this.itemsArray.at(index);
    const currentStock = item.get('currentStock')?.value || 0;
    const auditedStock = item.get('auditedStock')?.value || 0;
    const difference = auditedStock - currentStock;
    
    let adjustmentType: 'increase' | 'decrease' | 'none' = 'none';
    if (difference > 0) {
      adjustmentType = 'increase';
    } else if (difference < 0) {
      adjustmentType = 'decrease';
    }
    
    item.patchValue({
      difference: difference,
      adjustmentType: adjustmentType
    });

    // Update reason requirement
    const reasonControl = item.get('reason');
    if (adjustmentType !== 'none') {
      reasonControl?.setValidators(Validators.required);
    } else {
      reasonControl?.clearValidators();
      reasonControl?.patchValue('');
    }
    reasonControl?.updateValueAndValidity();
    
    // Update the audit item
    this.stockAuditItems[index] = {
      ...this.stockAuditItems[index],
      auditedStock,
      difference,
      adjustmentType
    };
  }

  getTotalAdjustments(): {increases: number, decreases: number, net: number} {
    let increases = 0;
    let decreases = 0;
    
    this.itemsArray.controls.forEach(control => {
      const difference = control.get('difference')?.value || 0;
      if (difference > 0) {
        increases += difference;
      } else if (difference < 0) {
        decreases += Math.abs(difference);
      }
    });
    
    return {
      increases,
      decreases,
      net: increases - decreases
    };
  }

  hasAdjustments(): boolean {
    return this.itemsArray.controls.some(control => {
      const difference = control.get('difference')?.value || 0;
      return difference !== 0;
    });
  }

  async onSubmit(): Promise<void> {
    if (this.auditForm.valid && !this.isLoading) {
      if (!this.hasAdjustments()) {
        alert('No stock adjustments found. Audit completed without changes.');
        this.router.navigate(['/dashboard']);
        return;
      }

      this.isLoading = true;
      
      try {
        const formValue = this.auditForm.getRawValue();
        
        // Process each adjustment
        for (const item of formValue.items) {
          const difference = item.difference;
          
          if (difference !== 0) {
            if (difference > 0) {
              // Stock increase - add new stock entry
              await this.addAuditStock(item.productId, difference, item.reason);
            } else {
              // Stock decrease - remove stock using FIFO
              await this.removeAuditStock(item.productId, Math.abs(difference), item.reason);
            }
          }
        }

        // Create audit log (you might want to add an audit table for this)
        const auditLog = {
          date: new Date(formValue.auditDate),
          auditor: this.currentUser?.salesmanname || 'Unknown',
          type: formValue.auditType,
          notes: formValue.notes || '',
          adjustments: this.getTotalAdjustments(),
          itemsCount: formValue.items.length,
          adjustedItemsCount: formValue.items.filter((item: {difference: number}) => item.difference !== 0).length
        };

        console.log('Audit completed:', auditLog);

        alert('Stock audit completed successfully!');
        this.router.navigate(['/dashboard']);

      } catch (error) {
        console.error('Error processing audit:', error);
        alert('Error occurred while processing audit. Please try again.');
      } finally {
        this.isLoading = false;
      }
    }
  }

  private async addAuditStock(productId: number, quantity: number, reason: string): Promise<void> {
    const stockItem = {
      productid: productId,
      qty: quantity,
      pprice: 0, // Audit adjustment - no cost
      batch_no: `AUDIT-${Date.now()}`,
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      created_at: new Date()
    };

    await this.db.stock.add(stockItem);
    console.log(`Added ${quantity} units to stock for product ${productId}. Reason: ${reason}`);
  }

  private async removeAuditStock(productId: number, quantity: number, reason: string): Promise<void> {
    // Use FIFO to remove stock
    const stockRecords = await this.db.stock
      .where('productid')
      .equals(productId)
      .and(stock => stock.qty > 0)
      .sortBy('created_at');

    let remainingQuantity = quantity;
    
    for (const stock of stockRecords) {
      if (remainingQuantity <= 0) break;
      
      if (stock.qty >= remainingQuantity) {
        stock.qty -= remainingQuantity;
        remainingQuantity = 0;
      } else {
        remainingQuantity -= stock.qty;
        stock.qty = 0;
      }
      
      await this.db.stock.put(stock);
    }
    
    console.log(`Removed ${quantity} units from stock for product ${productId}. Reason: ${reason}`);
  }

  private async loadData(): Promise<void> {
    try {
      this.products = await this.db.products.toArray();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  private loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }

  isAdjustmentItem(index: number): boolean {
    const control = this.itemsArray.at(index);
    const difference = control.get('difference')?.value || 0;
    return difference !== 0;
  }
}