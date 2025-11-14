export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;

  children?: NavigationItem[];
}
export const NavigationItems: NavigationItem[] = [
  {
    id: 'main',
    title: 'MAIN',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'item',
        url: '/dashboard',
        icon: 'feather icon-home',
        classes: 'nav-item'
      }
    ]
  },
  {
    id: 'transactions',
    title: 'TRANSACTIONS',
    type: 'group',
    icon: 'icon-ui',
    children: [
      {
        id: 'sales',
        title: 'Sales',
        type: 'collapse',
        icon: 'feather icon-shopping-cart',
        children: [
          {
            id: 'sale',
            title: 'Sale',
            type: 'item',
            url: '/transactions/sale'
          },
          {
            id: 'sale-return',
            title: 'Sale Return',
            type: 'item',
            url: '/transactions/sale-return'
          }
        ]
      },
      {
        id: 'purchase',
        title: 'Purchase',
        type: 'collapse',
        icon: 'feather icon-truck',
        children: [
          {
            id: 'purchase',
            title: 'Purchase',
            type: 'item',
            url: '/transactions/purchase'
          },
          {
            id: 'purchase-return',
            title: 'Purchase Return',
            type: 'item',
            url: '/transactions/purchase-return'
          }
        ]
      },
      {
        id: 'audit',
        title: 'Audit',
        type: 'item',
        url: '/transactions/audit',
        classes: 'nav-item',
        icon: 'feather icon-clipboard'
      }
    ]
  },
  {
    id: 'cash-management',
    title: 'CASH MANAGEMENT',
    type: 'group',
    icon: 'icon-group',
    children: [
      {
        id: 'recovery',
        title: 'Recovery',
        type: 'item',
        url: '/cash/recovery',
        classes: 'nav-item',
        icon: 'feather icon-dollar-sign'
      },
      {
        id: 'cash-receipt',
        title: 'Cash Receipt',
        type: 'item',
        url: '/cash/cash-receipt',
        classes: 'nav-item',
        icon: 'feather icon-download'
      },
      {
        id: 'cash-payment',
        title: 'Cash Payment',
        type: 'item',
        url: '/cash/cash-payment',
        classes: 'nav-item',
        icon: 'feather icon-upload'
      },
      {
        id: 'expense',
        title: 'Expense',
        type: 'item',
        url: '/cash/expense',
        classes: 'nav-item',
        icon: 'feather icon-credit-card'
      }
    ]
  },
  {
    id: 'inventory',
    title: 'INVENTORY',
    type: 'group',
    icon: 'icon-charts',
    children: [
      {
        id: 'products',
        title: 'Products',
        type: 'item',
        url: '/inventory/products',
        classes: 'nav-item',
        icon: 'feather icon-package'
      },
      {
        id: 'companies',
        title: 'Companies',
        type: 'item',
        url: '/inventory/companies',
        classes: 'nav-item',
        icon: 'feather icon-briefcase'
      },
      {
        id: 'brands',
        title: 'Brands',
        type: 'item',
        url: '/inventory/brands',
        classes: 'nav-item',
        icon: 'feather icon-tag'
      },
      {
        id: 'stock-balance',
        title: 'Stock Balance',
        type: 'item',
        url: '/inventory/stock-balance',
        classes: 'nav-item',
        icon: 'feather icon-layers'
      }
    ]
  },
  {
    id: 'accounts',
    title: 'ACCOUNTS',
    type: 'group',
    icon: 'icon-pages',
    children: [
      {
        id: 'customer-accounts',
        title: 'Customer Accounts',
        type: 'item',
        url: '/accounts/customers',
        classes: 'nav-item',
        icon: 'feather icon-users'
      },
      {
        id: 'supplier-accounts',
        title: 'Supplier Accounts',
        type: 'item',
        url: '/accounts/suppliers',
        classes: 'nav-item',
        icon: 'feather icon-user-plus'
      },
      {
        id: 'routes',
        title: 'Routes',
        type: 'item',
        url: '/accounts/routes',
        classes: 'nav-item',
        icon: 'feather icon-map-pin'
      },
      {
        id: 'salesman',
        title: 'Salesman',
        type: 'item',
        url: '/accounts/salesman',
        classes: 'nav-item',
        icon: 'feather icon-user-check'
      }
    ]
  },
  {
    id: 'reports',
    title: 'REPORTS',
    type: 'group',
    icon: 'icon-charts',
    children: [
      {
        id: 'sales-reports',
        title: 'Sales Reports',
        type: 'collapse',
        icon: 'feather icon-bar-chart-2',
        children: [
          {
            id: 'daily-sales',
            title: 'Daily Sales',
            type: 'item',
            url: '/reports/daily-sales'
          },
          {
            id: 'monthly-sales',
            title: 'Monthly Sales',
            type: 'item',
            url: '/reports/monthly-sales'
          },
          {
            id: 'product-wise-sales',
            title: 'Product Wise Sales',
            type: 'item',
            url: '/reports/product-wise-sales'
          },
          {
            id: 'route-wise-sales',
            title: 'Route Wise Sales',
            type: 'item',
            url: '/reports/route-wise-sales'
          }
        ]
      },
      {
        id: 'stock-reports',
        title: 'Stock Reports',
        type: 'collapse',
        icon: 'feather icon-package',
        children: [
          {
            id: 'current-stock',
            title: 'Current Stock',
            type: 'item',
            url: '/reports/current-stock'
          },
          {
            id: 'stock-movement',
            title: 'Stock Movement',
            type: 'item',
            url: '/reports/stock-movement'
          },
          {
            id: 'low-stock',
            title: 'Low Stock',
            type: 'item',
            url: '/reports/low-stock'
          }
        ]
      },
      {
        id: 'recovery-reports',
        title: 'Recovery Reports',
        type: 'item',
        url: '/reports/recovery',
        classes: 'nav-item',
        icon: 'feather icon-dollar-sign'
      },
      {
        id: 'profit-reports',
        title: 'Profit Reports',
        type: 'item',
        url: '/reports/profit',
        classes: 'nav-item',
        icon: 'feather icon-trending-up'
      }
    ]
  },
  {
    id: 'settings',
    title: 'SETTINGS',
    type: 'group',
    icon: 'icon-pages',
    children: [
      {
        id: 'sync',
        title: 'Data Sync',
        type: 'item',
        url: '/settings/sync',
        classes: 'nav-item',
        icon: 'feather icon-refresh-cw'
      },
      {
        id: 'backup',
        title: 'Backup & Restore',
        type: 'item',
        url: '/settings/backup',
        classes: 'nav-item',
        icon: 'feather icon-database'
      },
      {
        id: 'logout',
        title: 'Logout',
        type: 'item',
        url: '/login',
        classes: 'nav-item',
        icon: 'feather icon-log-out'
      }
    ]
  }
];
