import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    badge: {
      color: 'info',
      text: 'MAIN'
    }
  },
  {
    title: true,
    name: 'Accounting'
  },
  {
    name: 'Chart of Accounts',
    url: '/accounting/chart-of-accounts',
    iconComponent: { name: 'cil-list' }
  },
  {
    name: 'General Ledger',
    url: '/accounting/general-ledger',
    iconComponent: { name: 'cil-book' }
  },
  {
    name: 'Journal Vouchers',
    url: '/accounting/journal-vouchers',
    iconComponent: { name: 'cil-notes' },
    children: [
      {
        name: 'Create Voucher',
        url: '/accounting/journal-vouchers/create',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'View Vouchers',
        url: '/accounting/journal-vouchers/list',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Voucher Approval',
        url: '/accounting/journal-vouchers/approval',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  {
    name: 'Accounts Receivable',
    url: '/accounting/accounts-receivable',
    iconComponent: { name: 'cil-arrow-circle-right' },
    children: [
      {
        name: 'Customer Management',
        url: '/accounting/accounts-receivable/customers',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Invoices',
        url: '/accounting/accounts-receivable/invoices',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Receipts',
        url: '/accounting/accounts-receivable/receipts',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Aging Report',
        url: '/accounting/accounts-receivable/aging',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  {
    name: 'Accounts Payable',
    url: '/accounting/accounts-payable',
    iconComponent: { name: 'cil-arrow-circle-left' },
    children: [
      {
        name: 'Vendor Management',
        url: '/accounting/accounts-payable/vendors',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Bills & Invoices',
        url: '/accounting/accounts-payable/bills',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Payments',
        url: '/accounting/accounts-payable/payments',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Vendor Aging',
        url: '/accounting/accounts-payable/aging',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  {
    name: 'Cash & Bank',
    url: '/accounting/cash-bank',
    iconComponent: { name: 'cil-bank' },
    children: [
      {
        name: 'Cash Management',
        url: '/accounting/cash-bank/cash',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Bank Accounts',
        url: '/accounting/cash-bank/banks',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Bank Reconciliation',
        url: '/accounting/cash-bank/reconciliation',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  {
    title: true,
    name: 'Financial Reports'
  },
  {
    name: 'Trial Balance',
    url: '/reports/trial-balance',
    iconComponent: { name: 'cil-balance-scale' }
  },
  {
    name: 'Income Statement',
    url: '/reports/income-statement',
    iconComponent: { name: 'cil-chart-line' }
  },
  {
    name: 'Balance Sheet',
    url: '/reports/balance-sheet',
    iconComponent: { name: 'cil-spreadsheet' }
  },
  {
    name: 'Cash Flow Statement',
    url: '/reports/cash-flow',
    iconComponent: { name: 'cil-money' }
  },
  {
    name: 'Financial Reports',
    url: '/reports',
    iconComponent: { name: 'cil-chart-pie' },
    children: [
      {
        name: 'Profit & Loss',
        url: '/reports/profit-loss',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Account Statements',
        url: '/reports/account-statements',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Comparative Reports',
        url: '/reports/comparative',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Budget vs Actual',
        url: '/reports/budget-actual',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  {
    title: true,
    name: 'Administration'
  },
  {
    name: 'Tenant Management',
    url: '/administration/tenant-management',
    iconComponent: { name: 'cil-institution' }
  },
  {
    name: 'User Management',
    url: '/administration/user-management',
    iconComponent: { name: 'cil-people' }
  },
  {
    name: 'Fiscal Year Setup',
    url: '/administration/fiscal-year',
    iconComponent: { name: 'cil-calendar' }
  },
  {
    name: 'Company Settings',
    url: '/administration/company-settings',
    iconComponent: { name: 'cil-settings' },
    children: [
      {
        name: 'Company Profile',
        url: '/administration/company-settings/profile',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Currency Settings',
        url: '/administration/company-settings/currency',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Backup & Restore',
        url: '/administration/company-settings/backup',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  {
    title: true,
    name: 'System',
    class: 'mt-auto'
  },
  {
    name: 'Audit Logs',
    url: '/system/audit-logs',
    iconComponent: { name: 'cil-history' }
  },
  {
    name: 'Documentation',
    url: 'https://coreui.io/angular/docs/',
    iconComponent: { name: 'cil-description' },
    attributes: { target: '_blank' }
  }
];
