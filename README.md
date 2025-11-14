# DMS Plus — Distribution Management System

DMS Plus is a distribution management application designed to help distributors manage Salesmen, Routes, Customers, Products, Sales, Credit, and Inventory efficiently.

It is built as an Angular 20 monorepo (Nx) with a CodeIgniter 4 backend API, optimized for fast workflows, shared UI components, and modular development.

## Key Capabilities
- Sales operations with fast item entry and keyboard-friendly search
- Route planning and salesman assignment
- Customer onboarding and account management
- Product catalog management (price, stock, status)
- Sales, returns, and credit handling
- Inventory tracking and adjustments
- Admin and reporting modules

## Tech Stack
- Angular 20 + Nx (monorepo)
- CoreUI + Bootstrap 5 (compiled CSS)
- Shared UI library (e.g., `SearchList` component)
- Shared Services library (API integration via `ApiService`)
- PHP CodeIgniter 4 backend API (`backend-api/`)

## Project Layout
- `apps/dms-plus/` – Main Angular application (Dashboard, Accounts, Inventory, Products, Transactions, Admin, etc.)
- `libs/shared-ui/` – Reusable UI components (SearchList with templates, keyboard navigation, focus API)
- `libs/shared-services/` – Cross-app services and tokens (API_BASE_URL)
- `libs/ui/` – Basic/legacy UI helpers
- `backend-api/` – REST API (see `REST_API_DOCUMENTATION.md`)

## Getting Started
Follow the setup guide to install dependencies, run the Angular app, and start the backend.

- Setup Guide: [HOW-TO-SETUP.md](./HOW-TO-SETUP.md)

## Highlights in UX
- Reusable `SearchList` with debounced filtering and custom templates for product picking
- Single-line sale item entry (select product → qty focus → Enter to add)
- Compact spacing and keyboard-first navigation to speed up sales workflows

## Documentation
- Backend API: `backend-api/REST_API_DOCUMENTATION.md`
- Shared UI: `libs/shared-ui/README.md`
- Shared Services: `libs/shared-services/README.md`

## Contributing
1. Create a feature branch
2. Use conventional commits
3. Open a PR to `main`

## License
MIT
