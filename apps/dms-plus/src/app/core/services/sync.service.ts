import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { SyncQueue } from '../models/database.models';
import { DatabaseService } from './database.service';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingItems: number;
  failedItems: number;
  isSyncing: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private syncStatusSubject = new BehaviorSubject<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    pendingItems: 0,
    failedItems: 0,
    isSyncing: false
  });

  public syncStatus$ = this.syncStatusSubject.asObservable();
  private syncInterval?: Subscription;
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRY_ATTEMPTS = 3;

  // Using modern inject() function instead of constructor injection
  private db = inject(DatabaseService);

  constructor() {
    this.initializeSync();
    this.setupOnlineListener();
  }

  private initializeSync(): void {
    // Start automatic sync every 5 minutes when online
    this.syncInterval = interval(this.SYNC_INTERVAL_MS).subscribe(() => {
      if (navigator.onLine && !this.syncStatusSubject.value.isSyncing) {
        this.performSync();
      }
    });

    // Load last sync date from config
    this.loadLastSyncDate();
  }

  private async loadLastSyncDate(): Promise<void> {
    try {
      // Wait for database to be ready
      await this.db.open();
      
      const config = await this.db.appConfig.where('key').equals('last_sync').first();
      if (config && config.value) {
        const lastSync = new Date(config.value);
        this.updateSyncStatus({ lastSync });
      }
    } catch (error) {
      console.error('Error loading last sync date:', error);
    }
  }

  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.updateSyncStatus({ isOnline: true });
      this.performSync(); // Sync immediately when coming online
    });

    window.addEventListener('offline', () => {
      this.updateSyncStatus({ isOnline: false });
    });
  }

  async performSync(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Cannot sync: offline');
      return;
    }

    this.updateSyncStatus({ isSyncing: true });

    try {
      // Get pending sync items
      const pendingItems = await this.db.getPendingSyncItems();
      this.updateSyncStatus({ pendingItems: pendingItems.length });

      if (pendingItems.length === 0) {
        console.log('No items to sync');
        this.updateSyncStatus({ isSyncing: false });
        return;
      }

      let successCount = 0;
      let failedCount = 0;

      for (const item of pendingItems) {
        try {
          const success = await this.syncItem(item);
          if (success) {
            successCount++;
            await this.markItemSynced(item);
          } else {
            failedCount++;
            await this.markItemFailed(item);
          }
        } catch (error) {
          console.error('Error syncing item:', error);
          failedCount++;
          await this.markItemFailed(item);
        }
      }

      // Update sync status
      const remaining = pendingItems.length - successCount;
      this.updateSyncStatus({ 
        pendingItems: remaining,
        failedItems: failedCount,
        lastSync: new Date(),
        isSyncing: false
      });

      // Save last sync date
      await this.saveLastSyncDate();

      console.log(`Sync completed: ${successCount} successful, ${failedCount} failed`);

    } catch (error) {
      console.error('Sync error:', error);
      this.updateSyncStatus({ isSyncing: false });
    }
  }

  private async syncItem(item: SyncQueue): Promise<boolean> {
    try {
      // In a real application, this would make HTTP requests to your server
      // For demonstration, we'll simulate API calls
      
      const endpoint = this.getEndpointForTable(item.table_name);
      // const method = this.getHttpMethod(item.operation); // Will be used when implementing actual HTTP calls
      
      // Simulate API call
      console.log(`Syncing ${item.operation} to ${endpoint}:`, item.data);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate 90% success rate
      return Math.random() > 0.1;
      
    } catch (error) {
      console.error(`Error syncing item ${item.id}:`, error);
      return false;
    }
  }

  private getEndpointForTable(tableName: string): string {
    const endpoints: Record<string, string> = {
      'products': '/api/products',
      'companies': '/api/companies',
      'salesman': '/api/salesman',
      'routes': '/api/routes',
      'accounts': '/api/accounts',
      'invoices': '/api/invoices',
      'invoice_details': '/api/invoice-details',
      'purchase_invoices': '/api/purchase-invoices',
      'vouchers': '/api/vouchers',
      'stock': '/api/stock'
    };
    return endpoints[tableName] || '/api/generic';
  }

  private getHttpMethod(operation: string): string {
    const methods: Record<string, string> = {
      'insert': 'POST',
      'update': 'PUT',
      'delete': 'DELETE'
    };
    return methods[operation] || 'POST';
  }

  private async markItemSynced(item: SyncQueue): Promise<void> {
    if (item.id) {
      await this.db.syncQueue.update(item.id, { 
        sync_status: 'synced',
        last_attempt: new Date()
      });
    }
  }

  private async markItemFailed(item: SyncQueue): Promise<void> {
    if (item.id) {
      const newRetryCount = item.retry_count + 1;
      const status = newRetryCount >= this.MAX_RETRY_ATTEMPTS ? 'failed' : 'pending';
      
      await this.db.syncQueue.update(item.id, { 
        sync_status: status,
        retry_count: newRetryCount,
        last_attempt: new Date()
      });
    }
  }

  private async saveLastSyncDate(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const existing = await this.db.appConfig.where('key').equals('last_sync').first();
      
      if (existing) {
        await this.db.appConfig.update(existing.id!, { value: now });
      } else {
        await this.db.appConfig.add({
          key: 'last_sync',
          value: now,
          description: 'Last successful sync timestamp'
        });
      }
    } catch (error) {
      console.error('Error saving last sync date:', error);
    }
  }

  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    const currentStatus = this.syncStatusSubject.value;
    this.syncStatusSubject.next({ ...currentStatus, ...updates });
  }

  // Public methods
  async forceSyncNow(): Promise<void> {
    if (!this.syncStatusSubject.value.isSyncing) {
      await this.performSync();
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const currentStatus = this.syncStatusSubject.value;
    const pendingItems = await this.db.syncQueue.where('sync_status').equals('pending').count();
    const failedItems = await this.db.syncQueue.where('sync_status').equals('failed').count();
    
    return {
      ...currentStatus,
      pendingItems,
      failedItems
    };
  }

  async clearFailedItems(): Promise<void> {
    try {
      await this.db.syncQueue.where('sync_status').equals('failed').delete();
      this.updateSyncStatus({ failedItems: 0 });
    } catch (error) {
      console.error('Error clearing failed items:', error);
    }
  }

  async retryFailedItems(): Promise<void> {
    try {
      await this.db.syncQueue
        .where('sync_status')
        .equals('failed')
        .modify({ sync_status: 'pending', retry_count: 0 });
      
      if (navigator.onLine) {
        this.performSync();
      }
    } catch (error) {
      console.error('Error retrying failed items:', error);
    }
  }

  destroy(): void {
    if (this.syncInterval) {
      this.syncInterval.unsubscribe();
    }
  }
}