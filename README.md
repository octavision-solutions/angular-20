# Version20

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is almost ready ✨.

Run `npx nx graph` to visually explore what got created. Now, let's get you up to speed!

## Finish your CI setup

[Click here to finish setting up your workspace!](https://cloud.nx.app/connect/Uh3hehXIpg)


## Run tasks

To run tasks with Nx use:

```sh
npx nx <target> <project-name>
```

For example:

```sh
npx nx build myproject
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

To install a new plugin you can use the `nx add` command. Here's an example of adding the React plugin:
```sh
npx nx add @nx/react
```

Use the plugin's generator to create new projects. For example, to create a new React app or library:

```sh
# Generate an app
# Angular 20 Workspace (Nx)

Monorepo for an Angular 20 application suite with a PHP (CodeIgniter 4) backend API. Built with Nx for efficient builds, shared libraries, and modular development.

## Overview
- Angular 20 + Nx workspace with multiple apps
- Shared UI and services libraries
- Backend API using CodeIgniter 4 in `backend-api/`
- Styling: Bootstrap 5 (compiled CSS), modern Sass modules (`@use`)

## Repository Structure
- `apps/`
	- `dms-plus/` – Main Angular app (Dashboard, Accounts, Inventory, Products, Transactions, Admin, etc.)
	- `accounts-app/`, `my-app/`, `api/` – Additional/sample Angular apps
- `libs/`
	- `shared-ui/` – Reusable UI components (e.g., SearchList)
	- `shared-services/` – Cross-app services (API, tokens)
	- `ui/` – Legacy/simple UI helpers
- `backend-api/` – CodeIgniter 4 REST API (see `REST_API_DOCUMENTATION.md`)

## Requirements
- Node.js 20+ and npm
- PHP 8.1+
- MySQL/MariaDB (or compatible)

## Setup
```sh
# Install dependencies
npm install

# Explore the project graph (optional)
npx nx graph
```

## Run the Angular App (dms-plus)
```sh
# Development server
npx nx serve dms-plus

# Production build
npx nx build dms-plus

# Lint and tests
npx nx lint dms-plus
npx nx test dms-plus
```

Angular environment settings (API base URL, etc.) live under the app’s `src/environments` directory. Adjust as needed for your setup.

## Backend API (CodeIgniter 4)
```sh
# Copy environment and configure DB
cp backend-api/.env.example backend-api/.env  # if present
# Or edit backend-api/app/Config/Database.php

# Create database schema
mysql -u <user> -p <db_name> < backend-api/database_setup.sql

# Serve API locally (PHP built-in server)
php -S localhost:8080 -t backend-api/public
```

More details and endpoints: `backend-api/REST_API_DOCUMENTATION.md` and `backend-api/README.md`.

## Notable Shared Components
- `shared-ui/SearchList`
	- Debounced filtering by keys
	- Customizable templates (item/header/footer/empty)
	- Keyboard navigation (ArrowUp/Down/Enter) and `focus()` API
	- Click-to-focus for seamless keyboard usage

## Styling Notes
- Bootstrap 5 via compiled CSS to avoid vendor Sass warnings
- Migrated app styles to modern Sass (`@use`); reduced legacy lints

## Scripts Cheatsheet
```sh
# Generic Nx usage
npx nx <target> <project>

# Examples
npx nx serve dms-plus
npx nx build dms-plus
npx nx lint dms-plus
npx nx test dms-plus
```

## Contributing
1. Create a feature branch
2. Commit with conventional messages
3. Open a PR against `main`

## License
MIT
