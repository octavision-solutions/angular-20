<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->setDefaultNamespace('App\Controllers');
$routes->setDefaultController('Home');
$routes->setDefaultMethod('index');
$routes->setTranslateURIDashes(false);
$routes->set404Override();

// API Routes
$routes->group('api/v1', ['namespace' => 'App\Controllers\Api\V1'], static function ($routes) {
    
    // Authentication routes
    $routes->post('auth/login', 'AuthController::login');
    $routes->post('auth/register', 'AuthController::register');
    $routes->post('auth/refresh', 'AuthController::refresh');
    $routes->post('auth/logout', 'AuthController::logout');
    $routes->get('auth/me', 'AuthController::me');
    
    // Tenant routes
    $routes->post('tenants/register', 'TenantController::register');
    $routes->get('tenants/(:segment)', 'TenantController::show/$1');
    $routes->put('tenants/(:segment)', 'TenantController::update/$1');
    
    // Protected routes (require authentication)
    $routes->group('', ['filter' => 'auth'], static function ($routes) {
        
        // Chart of Accounts routes
        $routes->get('chart-of-accounts', 'ChartOfAccountsController::index');
        $routes->post('chart-of-accounts', 'ChartOfAccountsController::create');
        $routes->get('chart-of-accounts/(:segment)', 'ChartOfAccountsController::show/$1');
        $routes->put('chart-of-accounts/(:segment)', 'ChartOfAccountsController::update/$1');
        $routes->delete('chart-of-accounts/(:segment)', 'ChartOfAccountsController::delete/$1');
        
        // Journal Vouchers routes
        $routes->get('journal-vouchers', 'JournalVoucherController::index');
        $routes->post('journal-vouchers', 'JournalVoucherController::create');
        $routes->get('journal-vouchers/(:segment)', 'JournalVoucherController::show/$1');
        $routes->put('journal-vouchers/(:segment)', 'JournalVoucherController::update/$1');
        $routes->delete('journal-vouchers/(:segment)', 'JournalVoucherController::delete/$1');
        
        // General Ledger routes
        $routes->get('general-ledger', 'GeneralLedgerController::index');
        $routes->get('general-ledger/account/(:segment)', 'GeneralLedgerController::byAccount/$1');
        
        // Financial Reports routes
        $routes->get('reports/trial-balance', 'ReportsController::trialBalance');
        $routes->get('reports/income-statement', 'ReportsController::incomeStatement');
        $routes->get('reports/balance-sheet', 'ReportsController::balanceSheet');
        $routes->get('reports/cash-flow', 'ReportsController::cashFlow');
        
        // User Management routes (Super Admin only)
        $routes->group('users', ['filter' => 'role:super_admin'], static function ($routes) {
            $routes->get('', 'UserController::index');
            $routes->post('', 'UserController::create');
            $routes->get('(:segment)', 'UserController::show/$1');
            $routes->put('(:segment)', 'UserController::update/$1');
            $routes->delete('(:segment)', 'UserController::delete/$1');
        });
        
        // Profile routes
        $routes->get('profile', 'ProfileController::show');
        $routes->put('profile', 'ProfileController::update');
        $routes->put('profile/password', 'ProfileController::changePassword');
    });
});

// Catch-all route for Angular routing
$routes->get('(.*)', 'Home::index');