import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Invoice, InvoiceDetail, Product, Route } from '../../../../core/models/database.models';
import { AuthService } from '../../../../core/services/auth.service';
import { DatabaseService } from '../../../../core/services/database.service';

@Component({
  selector: 'app-sale-return',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sale-return.component.html',
  styleUrls: ['./sale-return.component.scss']
})
export class SaleReturnComponent implements OnInit {
  private fb = inject(FormBuilder);
  private db = inject(DatabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  saleReturnForm!: FormGroup;
  products: Product[] = [];
  routes: Route[] = [];
  originalInvoices: Invoice[] = [];
  selectedInvoiceItems: InvoiceDetail[] = [];
  isLoading = false;
  currentUser: {salesmanid: number, salesmanname: string} | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
    this.loadCurrentUser();
  }

  private initializeForm(): void {
    this.saleReturnForm = this.fb.group({
      originalInvoiceId: ['', Validators.required],
      routeId: ['', Validators.required],
      customerName: ['', Validators.required],
      returnReason: ['', Validators.required],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      items: this.fb.array([])
    });
  }

  get itemsArray(): FormArray {
    return this.saleReturnForm.get('items') as FormArray;
  }

  private createItemFormGroup(invoiceItem?: InvoiceDetail): FormGroup {
    return this.fb.group({
      productId: [invoiceItem?.productid || '', Validators.required],
      originalQuantity: [invoiceItem?.qty || 0],
      returnQuantity: [0, [Validators.required, Validators.min(1)]],
      rate: [invoiceItem?.sprice || 0, [Validators.required, Validators.min(0)]],
      total: [{value: 0, disabled: true}]
    });
  }

  async onOriginalInvoiceChange(): Promise<void> {
    const invoiceId = this.saleReturnForm.get('originalInvoiceId')?.value;
    if (!invoiceId) {
      this.clearItems();
      return;
    }

    try {
      // Get original invoice details
      const originalInvoice = await this.db.invoices.get(invoiceId);
      const invoiceItems = await this.db.invoiceDetails
        .where('invoiceid')
        .equals(invoiceId)
        .toArray();

      if (originalInvoice && invoiceItems.length > 0) {
        // Update form with original invoice data
        this.saleReturnForm.patchValue({
          routeId: originalInvoice.routeid,
          customerName: originalInvoice.notes?.replace('Customer: ', '') || ''
        });

        this.selectedInvoiceItems = invoiceItems;
        this.populateItemsFromInvoice(invoiceItems);
      }
    } catch (error) {
      console.error('Error loading original invoice:', error);
      alert('Error loading original invoice. Please try again.');
    }
  }

  private clearItems(): void {
    while (this.itemsArray.length !== 0) {
      this.itemsArray.removeAt(0);
    }
    this.selectedInvoiceItems = [];
  }

  private populateItemsFromInvoice(invoiceItems: InvoiceDetail[]): void {
    this.clearItems();
    
    invoiceItems.forEach(item => {
      const itemFormGroup = this.createItemFormGroup(item);
      this.itemsArray.push(itemFormGroup);
    });
  }

  onReturnQuantityChange(index: number): void {
    const item = this.itemsArray.at(index);
    const returnQuantity = item.get('returnQuantity')?.value || 0;
    const originalQuantity = item.get('originalQuantity')?.value || 0;
    const rate = item.get('rate')?.value || 0;

    // Validate return quantity doesn't exceed original quantity
    if (returnQuantity > originalQuantity) {
      item.patchValue({ returnQuantity: originalQuantity });
      return;
    }

    // Calculate total
    const total = returnQuantity * rate;
    item.patchValue({ total: total });
  }

  calculateSubTotal(): number {
    return this.itemsArray.controls.reduce((sum, control) => {
      const returnQuantity = control.get('returnQuantity')?.value || 0;
      const rate = control.get('rate')?.value || 0;
      return sum + (returnQuantity * rate);
    }, 0);
  }

  calculateDiscountAmount(): number {
    const subTotal = this.calculateSubTotal();
    const discountPercent = this.saleReturnForm.get('discount')?.value || 0;
    return (subTotal * discountPercent) / 100;
  }

  calculateTotal(): number {
    return this.calculateSubTotal() - this.calculateDiscountAmount();
  }

  async onSubmit(): Promise<void> {
    if (this.saleReturnForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      try {
        const formValue = this.saleReturnForm.getRawValue();
        
        // Validate at least one item has return quantity > 0
        const hasReturns = formValue.items.some((item: {returnQuantity: number}) => item.returnQuantity > 0);
        if (!hasReturns) {
          alert('Please enter return quantities for at least one item.');
          this.isLoading = false;
          return;
        }

        // Create return invoice
        const returnInvoice: Partial<Invoice> = {
          date: new Date(),
          routeid: formValue.routeId,
          salesmanid: this.currentUser?.salesmanid || 1,
          account_id: 1, // Default account for cash returns
          is_cash: true,
          amount: this.calculateSubTotal(),
          discount: this.calculateDiscountAmount(),
          scheme: 0,
          tax: 0,
          net_amount: this.calculateTotal(),
          dt_cr: 'return',
          notes: `Return for Customer: ${formValue.customerName}. Reason: ${formValue.returnReason}`,
          sync_status: 'pending'
        };

        const returnInvoiceId = await this.db.invoices.add(returnInvoice as Invoice);

        // Process return items
        for (const item of formValue.items) {
          if (item.returnQuantity > 0) {
            const returnItem: Partial<InvoiceDetail> = {
              invoiceid: returnInvoiceId,
              productid: item.productId,
              qty: item.returnQuantity,
              sprice: item.rate,
              pprice: 0, // Will be calculated from original purchase
              disc_age: 0,
              scheme: 0,
              bonus: 0,
              tax_ratio: 0,
              net_amount: item.returnQuantity * item.rate
            };

            await this.db.invoiceDetails.add(returnItem as InvoiceDetail);

            // Add returned items back to stock
            await this.addReturnedStock(item.productId, item.returnQuantity, item.rate);
          }
        }

        alert('Sale return processed successfully!');
        this.router.navigate(['/dashboard']);

      } catch (error) {
        console.error('Error processing sale return:', error);
        alert('Error occurred while processing sale return. Please try again.');
      } finally {
        this.isLoading = false;
      }
    }
  }

  private async addReturnedStock(productId: number, quantity: number, salePrice: number): Promise<void> {
    // For returns, we add back to stock at the average purchase price
    // In a real system, you might want to track the original purchase price
    const avgPurchasePrice = salePrice * 0.8; // Assuming 20% margin

    const stockItem = {
      productid: productId,
      qty: quantity,
      pprice: avgPurchasePrice,
      batch_no: `RETURN-${Date.now()}`,
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      created_at: new Date()
    };

    await this.db.stock.add(stockItem);
  }

  private async loadData(): Promise<void> {
    try {
      this.products = await this.db.products.toArray();
      this.routes = await this.db.routes.toArray();
      
      // Load recent sale invoices (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      this.originalInvoices = await this.db.invoices
        .where('dt_cr')
        .equals('sale')
        .and(invoice => invoice.date >= thirtyDaysAgo)
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