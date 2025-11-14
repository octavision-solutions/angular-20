import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StubDatabaseService {
  // Stub implementation to avoid build errors
  async initializeDatabase() {
    console.log('Stub: initializeDatabase called');
  }

  // Add stub properties and methods as needed
  products = {
    toArray: () => Promise.resolve([]),
    add: (data: any) => Promise.resolve(1),
    update: (id: any, data: any) => Promise.resolve(1),
    delete: (id: any) => Promise.resolve(),
    orderBy: (field: string) => ({ toArray: () => Promise.resolve([]) })
  };

  companies = {
    toArray: () => Promise.resolve([]),
    orderBy: (field: string) => ({ toArray: () => Promise.resolve([]) })
  };

  stock = {
    toArray: () => Promise.resolve([]),
    add: (data: any) => Promise.resolve(1),
    put: (data: any) => Promise.resolve(1),
    where: (field: string) => ({
      equals: (value: any) => ({
        and: (filter: any) => ({
          toArray: () => Promise.resolve([])
        })
      })
    })
  };

  invoices = {
    toArray: () => Promise.resolve([]),
    add: (data: any) => Promise.resolve(1),
    get: (id: any) => Promise.resolve(null),
    orderBy: (field: string) => ({
      toArray: () => Promise.resolve([]),
      reverse: () => ({ toArray: () => Promise.resolve([]) }),
      limit: (count: number) => ({ toArray: () => Promise.resolve([]) })
    }),
    where: (field: string) => ({
      equals: (value: any) => ({
        and: (filter: any) => ({
          toArray: () => Promise.resolve([])
        })
      })
    })
  };

  invoiceDetails = {
    add: (data: any) => Promise.resolve(1),
    where: (field: string) => ({
      equals: (value: any) => ({ toArray: () => Promise.resolve([]) })
    })
  };

  purchaseInvoices = {
    toArray: () => Promise.resolve([]),
    add: (data: any) => Promise.resolve(1),
    get: (id: any) => Promise.resolve(null),
    where: (field: string) => ({
      equals: (value: any) => ({
        and: (filter: any) => ({
          toArray: () => Promise.resolve([])
        })
      })
    })
  };

  purchaseInvoiceDetails = {
    add: (data: any) => Promise.resolve(1),
    where: (field: string) => ({
      equals: (value: any) => ({ toArray: () => Promise.resolve([]) })
    })
  };

  vouchers = {
    add: (data: any) => Promise.resolve(1),
    where: (field: string) => ({
      equals: (value: any) => ({
        and: (filter: any) => ({
          reduce: (fn: any, init: any) => init,
          toArray: () => Promise.resolve([])
        })
      })
    })
  };

  routes = {
    toArray: () => Promise.resolve([])
  };

  salesman = {
    toArray: () => Promise.resolve([]).catch(() => [])
  };

  accounts = {
    toArray: () => Promise.resolve([]).catch(() => [])
  };

  async addToSyncQueue(table: string, id: any, operation: string) {
    console.log('Stub: addToSyncQueue called', { table, id, operation });
  }
}