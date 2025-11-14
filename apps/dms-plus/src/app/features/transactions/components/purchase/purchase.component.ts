import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Company, Product, PurchaseInvoice, PurchaseInvoiceDetail } from '../../../../core/models/database.models';
import { AuthService } from '../../../../core/services/auth.service';
import { DatabaseService } from '../../../../core/services/database.service';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss']
})
export class PurchaseComponent implements OnInit {
  private fb = inject(FormBuilder);
  private db = inject(DatabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  purchaseForm!: FormGroup;
  products: Product[] = [];
  companies: Company[] = [];
  isLoading = false;
  currentUser: {salesmanid: number, salesmanname: string} | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
    this.loadCurrentUser();
  }

  private initializeForm(): void {
    this.purchaseForm = this.fb.group({
      supplierName: ['', Validators.required],
      invoiceNumber: ['', Validators.required],
      invoiceDate: ['', Validators.required],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      items: this.fb.array([])
    });

    this.addItem(); // Add one item by default
  }

  get itemsArray(): FormArray {
    return this.purchaseForm.get('items') as FormArray;
  }

  private createItemFormGroup(): FormGroup {
    return this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      purchaseRate: [0, [Validators.required, Validators.min(0)]],
      saleRate: [0, [Validators.required, Validators.min(0)]],
      total: [{value: 0, disabled: true}]
    });
  }

  addItem(): void {
    this.itemsArray.push(this.createItemFormGroup());
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
    }
  }

  onQuantityOrRateChange(index: number): void {
    this.calculateItemTotal(index);
  }

  private calculateItemTotal(index: number): void {
    const item = this.itemsArray.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const rate = item.get('purchaseRate')?.value || 0;
    const total = quantity * rate;
    
    item.patchValue({
      total: total
    });
  }

  calculateSubTotal(): number {
    return this.itemsArray.controls.reduce((sum, control) => {
      const quantity = control.get('quantity')?.value || 0;
      const rate = control.get('purchaseRate')?.value || 0;
      return sum + (quantity * rate);
    }, 0);
  }

  calculateDiscountAmount(): number {
    const subTotal = this.calculateSubTotal();
    const discountPercent = this.purchaseForm.get('discount')?.value || 0;
    return (subTotal * discountPercent) / 100;
  }

  calculateTotal(): number {
    return this.calculateSubTotal() - this.calculateDiscountAmount();
  }

  async onSubmit(): Promise<void> {
    if (this.purchaseForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      try {
        const formValue = this.purchaseForm.getRawValue();

        // Create purchase invoice
        const purchaseInvoice: Partial<PurchaseInvoice> = {
          date: new Date(),
          inv_date: new Date(formValue.invoiceDate),
          inv_no: formValue.invoiceNumber,
          account_id: 1, // Default supplier account
          amount: this.calculateSubTotal(),
          discount: this.calculateDiscountAmount(),
          scheme: 0,
          tax: 0,
          net_amount: this.calculateTotal(),
          dt_cr: 'purchase',
          notes: `Supplier: ${formValue.supplierName}`,
          sync_status: 'pending'
        };

        const invoiceId = await this.db.purchaseInvoices.add(purchaseInvoice as PurchaseInvoice);

        // Add purchase items and update stock
        for (const item of formValue.items) {
          const purchaseItem: Partial<PurchaseInvoiceDetail> = {
            invoiceid: invoiceId,
            productid: item.productId,
            qty: item.quantity,
            sprice: item.saleRate,
            pprice: item.purchaseRate,
            disc_age: 0,
            scheme: 0,
            bonus: 0,
            tax_ratio: 0,
            net_amount: item.quantity * item.purchaseRate
          };

          await this.db.purchaseInvoiceDetails.add(purchaseItem as PurchaseInvoiceDetail);

          // Add to stock
          await this.addToStock(item.productId, item.quantity, item.purchaseRate);
        }

        alert('Purchase recorded successfully!');
        this.router.navigate(['/dashboard']);

      } catch (error) {
        console.error('Error saving purchase:', error);
        alert('Error occurred while saving purchase. Please try again.');
      } finally {
        this.isLoading = false;
      }
    }
  }

  private async addToStock(productId: number, quantity: number, purchasePrice: number): Promise<void> {
    const stockItem = {
      productid: productId,
      qty: quantity,
      pprice: purchasePrice,
      batch_no: `BATCH-${Date.now()}`,
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      created_at: new Date()
    };

    await this.db.stock.add(stockItem);
  }

  private async loadData(): Promise<void> {
    try {
      this.products = await this.db.products.toArray();
      this.companies = await this.db.companies.toArray();
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
}