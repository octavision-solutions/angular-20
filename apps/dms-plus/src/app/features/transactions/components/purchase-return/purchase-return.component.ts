import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Product, PurchaseInvoice, PurchaseInvoiceDetail } from '../../../../core/models/database.models';
import { AuthService } from '../../../../core/services/auth.service';
import { DatabaseService } from '../../../../core/services/database.service';

@Component({
  selector: 'app-purchase-return',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './purchase-return.component.html',
  styleUrls: ['./purchase-return.component.scss']
})
export class PurchaseReturnComponent implements OnInit {
  private fb = inject(FormBuilder);
  private db = inject(DatabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  purchaseReturnForm!: FormGroup;
  products: Product[] = [];
  originalPurchases: PurchaseInvoice[] = [];
  selectedPurchaseItems: PurchaseInvoiceDetail[] = [];
  isLoading = false;
  currentUser: {salesmanid: number, salesmanname: string} | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
    this.loadCurrentUser();
  }

  private initializeForm(): void {
    this.purchaseReturnForm = this.fb.group({
      originalPurchaseId: ['', Validators.required],
      supplierName: ['', Validators.required],
      returnReason: ['', Validators.required],
      returnInvoiceNumber: ['', Validators.required],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      items: this.fb.array([])
    });
  }

  get itemsArray(): FormArray {
    return this.purchaseReturnForm.get('items') as FormArray;
  }

  private createItemFormGroup(purchaseItem?: PurchaseInvoiceDetail): FormGroup {
    return this.fb.group({
      productId: [purchaseItem?.productid || '', Validators.required],
      originalQuantity: [purchaseItem?.qty || 0],
      returnQuantity: [0, [Validators.required, Validators.min(1)]],
      purchaseRate: [purchaseItem?.pprice || 0, [Validators.required, Validators.min(0)]],
      saleRate: [purchaseItem?.sprice || 0, [Validators.required, Validators.min(0)]],
      total: [{value: 0, disabled: true}]
    });
  }

  async onOriginalPurchaseChange(): Promise<void> {
    const purchaseId = this.purchaseReturnForm.get('originalPurchaseId')?.value;
    if (!purchaseId) {
      this.clearItems();
      return;
    }

    try {
      // Get original purchase details
      const originalPurchase = await this.db.purchaseInvoices.get(purchaseId);
      const purchaseItems = await this.db.purchaseInvoiceDetails
        .where('invoiceid')
        .equals(purchaseId)
        .toArray();

      if (originalPurchase && purchaseItems.length > 0) {
        // Update form with original purchase data
        this.purchaseReturnForm.patchValue({
          supplierName: originalPurchase.notes?.replace('Supplier: ', '') || ''
        });

        this.selectedPurchaseItems = purchaseItems;
        this.populateItemsFromPurchase(purchaseItems);
      }
    } catch (error) {
      console.error('Error loading original purchase:', error);
      alert('Error loading original purchase. Please try again.');
    }
  }

  private clearItems(): void {
    while (this.itemsArray.length !== 0) {
      this.itemsArray.removeAt(0);
    }
    this.selectedPurchaseItems = [];
  }

  private populateItemsFromPurchase(purchaseItems: PurchaseInvoiceDetail[]): void {
    this.clearItems();
    
    purchaseItems.forEach(item => {
      const itemFormGroup = this.createItemFormGroup(item);
      this.itemsArray.push(itemFormGroup);
    });
  }

  onReturnQuantityChange(index: number): void {
    const item = this.itemsArray.at(index);
    const returnQuantity = item.get('returnQuantity')?.value || 0;
    const originalQuantity = item.get('originalQuantity')?.value || 0;
    const purchaseRate = item.get('purchaseRate')?.value || 0;

    // Validate return quantity doesn't exceed original quantity
    if (returnQuantity > originalQuantity) {
      item.patchValue({ returnQuantity: originalQuantity });
      return;
    }

    // Calculate total based on purchase rate (what we paid)
    const total = returnQuantity * purchaseRate;
    item.patchValue({ total: total });
  }

  calculateSubTotal(): number {
    return this.itemsArray.controls.reduce((sum, control) => {
      const returnQuantity = control.get('returnQuantity')?.value || 0;
      const purchaseRate = control.get('purchaseRate')?.value || 0;
      return sum + (returnQuantity * purchaseRate);
    }, 0);
  }

  calculateDiscountAmount(): number {
    const subTotal = this.calculateSubTotal();
    const discountPercent = this.purchaseReturnForm.get('discount')?.value || 0;
    return (subTotal * discountPercent) / 100;
  }

  calculateTotal(): number {
    return this.calculateSubTotal() - this.calculateDiscountAmount();
  }

  async onSubmit(): Promise<void> {
    if (this.purchaseReturnForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      try {
        const formValue = this.purchaseReturnForm.getRawValue();
        
        // Validate at least one item has return quantity > 0
        const hasReturns = formValue.items.some((item: {returnQuantity: number}) => item.returnQuantity > 0);
        if (!hasReturns) {
          alert('Please enter return quantities for at least one item.');
          this.isLoading = false;
          return;
        }

        // Check if returned items are available in stock
        const stockCheck = await this.checkReturnStockAvailability(formValue.items);
        if (!stockCheck.available) {
          alert(`Insufficient stock for return: ${stockCheck.productName}. Available: ${stockCheck.availableQty}, Required: ${stockCheck.requiredQty}`);
          this.isLoading = false;
          return;
        }

        // Create return purchase invoice
        const returnPurchase: Partial<PurchaseInvoice> = {
          date: new Date(),
          inv_date: new Date(),
          inv_no: formValue.returnInvoiceNumber,
          account_id: 1, // Default supplier account
          amount: this.calculateSubTotal(),
          discount: this.calculateDiscountAmount(),
          scheme: 0,
          tax: 0,
          net_amount: this.calculateTotal(),
          dt_cr: 'return',
          notes: `Purchase Return to: ${formValue.supplierName}. Reason: ${formValue.returnReason}`,
          sync_status: 'pending'
        };

        const returnPurchaseId = await this.db.purchaseInvoices.add(returnPurchase as PurchaseInvoice);

        // Process return items
        for (const item of formValue.items) {
          if (item.returnQuantity > 0) {
            const returnItem: Partial<PurchaseInvoiceDetail> = {
              invoiceid: returnPurchaseId,
              productid: item.productId,
              qty: item.returnQuantity,
              sprice: item.saleRate,
              pprice: item.purchaseRate,
              disc_age: 0,
              scheme: 0,
              bonus: 0,
              tax_ratio: 0,
              net_amount: item.returnQuantity * item.purchaseRate
            };

            await this.db.purchaseInvoiceDetails.add(returnItem as PurchaseInvoiceDetail);

            // Remove returned items from stock
            await this.removeReturnedStock(item.productId, item.returnQuantity);
          }
        }

        alert('Purchase return processed successfully!');
        this.router.navigate(['/dashboard']);

      } catch (error) {
        console.error('Error processing purchase return:', error);
        alert('Error occurred while processing purchase return. Please try again.');
      } finally {
        this.isLoading = false;
      }
    }
  }

  private async checkReturnStockAvailability(items: {productId: number, returnQuantity: number}[]): Promise<{available: boolean, productName?: string, availableQty?: number, requiredQty?: number}> {
    for (const item of items) {
      if (item.returnQuantity <= 0) continue;
      
      const stockRecords = await this.db.stock
        .where('productid')
        .equals(item.productId)
        .and(stock => stock.qty > 0)
        .toArray();
      
      const totalStock = stockRecords.reduce((sum, stock) => sum + stock.qty, 0);
      
      if (totalStock < item.returnQuantity) {
        const product = this.products.find(p => p.productid === item.productId);
        return {
          available: false,
          productName: product?.product_name || 'Unknown Product',
          availableQty: totalStock,
          requiredQty: item.returnQuantity
        };
      }
    }
    return { available: true };
  }

  private async removeReturnedStock(productId: number, returnQuantity: number): Promise<void> {
    // Use FIFO to remove stock
    const stockRecords = await this.db.stock
      .where('productid')
      .equals(productId)
      .and(stock => stock.qty > 0)
      .sortBy('created_at');

    let remainingQuantity = returnQuantity;
    
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
  }

  private async loadData(): Promise<void> {
    try {
      this.products = await this.db.products.toArray();
      
      // Load recent purchase invoices (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      this.originalPurchases = await this.db.purchaseInvoices
        .where('dt_cr')
        .equals('purchase')
        .and(purchase => purchase.date >= thirtyDaysAgo)
        .reverse()
        .sortBy('date');

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

  getProductName(productId: number): string {
    const product = this.products.find(p => p.productid === productId);
    return product?.product_name || 'Unknown Product';
  }
}