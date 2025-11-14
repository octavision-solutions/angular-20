import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SearchEmptyTemplateDirective, SearchItemTemplateDirective, SearchListComponent } from '@version-20/shared-ui';
import { Account, Company, Invoice, InvoiceDetail, Product, Route, Salesman } from '../../../../core/models/database.models';
import { AuthService } from '../../../../core/services/auth.service';
import { DatabaseService } from '../../../../core/services/database.service';

@Component({
  selector: 'app-sale',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SearchListComponent, SearchItemTemplateDirective, SearchEmptyTemplateDirective],
  templateUrl: './sale.component.html',
  styleUrls: ['./sale.component.scss']
})
export class SaleComponent implements OnInit {
  private fb = inject(FormBuilder);
  private db = inject(DatabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  saleForm!: FormGroup;
  // Items list (formerly FormArray) now stored as plain objects for simpler entry workflow
  items: Array<{
    productId: number;
    quantity: number;
    bonus: number;
    rate: number;
    disc_percent: number;
    disc_amount: number;
    net_amount: number;
  }> = [];
  products: Product[] = [];
  companies: Company[] = [];
  routes: Route[] = [];
  salesmen: Salesman[] = [];
  accounts: Account[] = [];
  filteredCustomers: Account[] = [];
  invoiceDate: string = new Date().toISOString().slice(0,10);
  selectedSalesmanId: number | '' = '';
  selectedRouteId: number | '' = '';
  selectedCustomerId: number | '' = '';
  productSearch = '';
  filteredProducts: Product[] = [];
  isLoading = false;
  currentUser: {salesmanid: number, salesmanname: string} | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
    this.loadCurrentUser();
  }

  @ViewChild('qtyInput') qtyInput!: ElementRef<HTMLInputElement>;
  @ViewChild('productList') productList?: SearchListComponent<Product>;

  private initializeForm(): void {
    this.saleForm = this.fb.group({
      routeId: ['', Validators.required],
      customerName: ['', Validators.required],
      customerPhone: [''],
      customerAddress: [''],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      // Single entry fields for the next item to add
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      bonus: [0],
      rate: [0, [Validators.required, Validators.min(0)]],
      disc_percent: [0, [Validators.min(0), Validators.max(100)]],
      disc_amount: [{ value: 0, disabled: true }],
      net_amount: [{ value: 0, disabled: true }]
    });
  }

  // Recalculate totals for the current entry line
  private recalcEntryTotals(): void {
    const quantity = Number(this.saleForm.get('quantity')?.value) || 0;
    const rate = Number(this.saleForm.get('rate')?.value) || 0;
    const discPercent = Number(this.saleForm.get('disc_percent')?.value) || 0;
    const gross = quantity * rate;
    const discAmount = (gross * discPercent) / 100;
    const net = gross - discAmount;
    this.saleForm.patchValue({ disc_amount: discAmount, net_amount: net }, { emitEvent: false });
  }

  onQuantityOrRateChange(): void {
    this.recalcEntryTotals();
  }

  // After selecting product from search list populate entry form & focus quantity
  onProductSelected(productId: number): void {
    const product = this.products.find(p => p.productid === productId);
    if (product) {
      this.saleForm.patchValue({ productId: product.productid, rate: product.sprice || 0, quantity: 1 });
      this.recalcEntryTotals();
      setTimeout(() => this.qtyInput?.nativeElement?.focus(), 50);
    }
  }

  addCurrentItem(): void {
    if (this.saleForm.get('productId')?.invalid || this.saleForm.get('quantity')?.invalid || this.saleForm.get('rate')?.invalid) {
      return; // basic validation
    }
    const raw = this.saleForm.getRawValue();
    this.items.push({
      productId: Number(raw.productId),
      quantity: Number(raw.quantity),
      bonus: Number(raw.bonus) || 0,
      rate: Number(raw.rate),
      disc_percent: Number(raw.disc_percent) || 0,
      disc_amount: Number(raw.disc_amount) || 0,
      net_amount: Number(raw.net_amount) || (Number(raw.quantity) * Number(raw.rate))
    });
    // reset entry fields (keep discount & customer fields untouched)
    this.saleForm.patchValue({
      productId: '',
      quantity: 1,
      bonus: 0,
      rate: 0,
      disc_percent: 0,
      disc_amount: 0,
      net_amount: 0
    });
    // After adding, focus back to product search list for fast entry
    setTimeout(() => this.productList?.focus(), 0);

  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
  }

  calculateSubTotal(): number {
    return this.items.reduce((sum, it) => sum + (Number(it.net_amount) || 0), 0);
  }

  calculateDiscountAmount(): number {
    const subTotal = this.calculateSubTotal();
    const discountPercent = this.saleForm.get('discount')?.value || 0;
    return (subTotal * discountPercent) / 100;
  }

  calculateTotal(): number {
    return this.calculateSubTotal() - this.calculateDiscountAmount();
  }

  async onSubmit(): Promise<void> {
    if (this.saleForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      try {
  const formValue = this.saleForm.getRawValue();

  // Check stock availability using items array
  const stockCheck = await this.checkStockAvailability(this.items);
        if (!stockCheck.available) {
          alert(`Insufficient stock for product: ${stockCheck.productName}`);
          this.isLoading = false;
          return;
        }

        // Create invoice
        const invoice: Partial<Invoice> = {
          date: new Date(this.invoiceDate),
          routeid: this.selectedRouteId || formValue.routeId,
          salesmanid: Number(this.selectedSalesmanId) || this.currentUser?.salesmanid || 1,
          account_id: 1, // Default account for cash sales
          is_cash: true,
          amount: this.calculateSubTotal(),
          discount: this.calculateDiscountAmount(),
          scheme: 0,
          tax: 0,
          net_amount: this.calculateTotal(),
          dt_cr: 'sale',
          notes: `Customer: ${formValue.customerName}`,
          sync_status: 'pending'
        };

        const invoiceId = await this.db.invoices.add(invoice as Invoice);

        // Add invoice items and update stock
  for (const item of this.items) {
          const invoiceItem: Partial<InvoiceDetail> = {
            invoiceid: invoiceId,
            productid: item.productId,
            qty: item.quantity,
            sprice: item.rate,
            pprice: 0, // Will be calculated from FIFO
            disc_age: 0,
            scheme: 0,
            bonus: 0,
            tax_ratio: 0,
            net_amount: item.net_amount || (item.quantity * item.rate)
          };

          await this.db.invoiceDetails.add(invoiceItem as InvoiceDetail);

          // Update stock (FIFO)
          await this.updateStock(item.productId, item.quantity);
        }

        alert('Sale completed successfully!');
        this.router.navigate(['/dashboard']);

      } catch (error) {
        console.error('Error saving sale:', error);
        alert('Error occurred while saving sale. Please try again.');
      } finally {
        this.isLoading = false;
      }
    }
  }

  private async checkStockAvailability(items: {productId: number, quantity: number}[]): Promise<{available: boolean, productName?: string}> {
    for (const item of items) {
      const stockRecords = await this.db.stock
        .where('productid')
        .equals(item.productId)
        .and(stock => stock.qty > 0)
        .toArray();
      
      const totalStock = stockRecords.reduce((sum, stock) => sum + stock.qty, 0);
      
      if (totalStock < item.quantity) {
        const product = this.products.find(p => p.productid === item.productId);
        return {
          available: false,
          productName: product?.product_name || 'Unknown Product'
        };
      }
    }
    return { available: true };
  }

  private async updateStock(productId: number, soldQuantity: number): Promise<void> {
    const stockRecords = await this.db.stock
      .where('productid')
      .equals(productId)
      .and(stock => stock.qty > 0)
      .sortBy('created_at');

    let remainingQuantity = soldQuantity;
    
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

  private async generateInvoiceNumber(): Promise<string> {
    const lastInvoice = await this.db.invoices
      .where('dt_cr')
      .equals('sale')
      .reverse()
      .sortBy('date');
    
    const lastNumber = lastInvoice.length > 0 ? 
      (lastInvoice[0].invoiceid || 0) : 0;
    
    return `INV-${(lastNumber + 1).toString().padStart(6, '0')}`;
  }

  private async loadData(): Promise<void> {
    try {
      this.products = await this.db.products.toArray();
      this.companies = await this.db.companies.toArray();
      this.routes = await this.db.routes.toArray();
      // load salesmen and accounts (customers)
      this.salesmen = await this.db.salesman.toArray().catch(() => []);
      this.accounts = await this.db.accounts.toArray().catch(() => []);
      this.filteredProducts = this.products.slice();
      // default customers: only accounts with acct_type 'customer'
  this.filteredCustomers = this.accounts.filter(a => (a as Account).acct_type === 'customer');
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  onDateChange(value: string): void {
    this.invoiceDate = value;
  }

  onRouteChange(routeId: number | string): void {
    this.selectedRouteId = routeId ? Number(routeId) : '';
    this.filteredCustomers = this.accounts.filter(a => {
      const isCustomer = (a as Account).acct_type === 'customer';
      if (!isCustomer) return false;
      if (!this.selectedRouteId) return true;
      return a.routeid === Number(this.selectedRouteId);
    });
  }

  onCustomerChange(customerId: number | string): void {
    this.selectedCustomerId = customerId ? Number(customerId) : '';
    const acc = this.accounts.find(a => a.account_id === Number(customerId));
    if (acc) {
      this.saleForm.patchValue({
        customerName: acc.account_name,
        customerPhone: String(acc.phone_no1 || acc.phone_no2 || ''),
        customerAddress: acc.address || ''
      });
    }
  }

  onProductSearch(term: string): void {
    const t = (term || '').toLowerCase();
    this.filteredProducts = this.products.filter(p => (p.product_name || '').toLowerCase().includes(t) || (p.code || '').toLowerCase().includes(t));
  }

  // Template-friendly select change handler
  onProductSelectChange(event: Event): void {
    const target = event?.target as HTMLSelectElement | null;
    const raw = target?.value ?? '';
    const id = Number(raw);
    if (!Number.isNaN(id)) {
      this.onProductSelected(id);
    }
  }

  selectProduct(p: Product): void {
    const id = p?.productid;
    if (id == null) return;
    this.onProductSelected(id);
  }

  getProductName(productId: number | undefined): string {
    const p = this.products.find(x => x.productid === productId);
    return p ? p.product_name : '-';
  }

  saveAndPrint(): void {
    this.onSubmit().then(() => {
      setTimeout(() => window.print(), 400);
    });
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