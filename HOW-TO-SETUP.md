# How To Setup and Run (Angular 20 + Nx + CodeIgniter)

This guide covers installing dependencies, running the Angular app (`dms-plus`), and starting the PHP (CodeIgniter 4) backend.

## Requirements
- Node.js 20+ and npm
- PHP 8.1+
- MySQL/MariaDB (or compatible)

## Install Dependencies
```sh
npm install

# (Optional) visualize the workspace graph
npx nx graph
```

## Run Angular App: dms-plus
```sh
# Start dev server
npx nx serve dms-plus

# Production build
npx nx build dms-plus

# Lint and unit tests
npx nx lint dms-plus
npx nx test dms-plus
```

Environment variables (e.g., API base URL) live under `apps/dms-plus/src/environments/`.

## Start Backend API (CodeIgniter 4)
```sh
# Configure DB credentials
# Option A: Copy .env example if present
cp backend-api/.env.example backend-api/.env  # if available

# Option B: Edit config directly
# backend-api/app/Config/Database.php

# Create database schema
mysql -u <user> -p <db_name> < backend-api/database_setup.sql

# Serve the API locally (built-in PHP server)
php -S localhost:8080 -t backend-api/public
```

API docs and details:
- `backend-api/REST_API_DOCUMENTATION.md`
- `backend-api/README.md`

## Libraries
- `libs/shared-ui` – reusable components (see `SearchList` docs in its README)
- `libs/shared-services` – cross-app services (see `ApiService` usage in its README)
- `libs/ui` – basic/legacy UI utilities

## Notes on Styling
- Bootstrap 5 via compiled CSS (no vendor Sass in app build)
- App styles use modern Sass modules (`@use`)

## Common Nx Commands
```sh
npx nx <target> <project>

# Examples
npx nx serve dms-plus
npx nx build dms-plus
npx nx lint dms-plus
npx nx test dms-plus
```
