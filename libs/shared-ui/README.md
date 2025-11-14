# Shared UI Library

Reusable UI components for the Angular 20 workspace.

## Components

### SearchList
Standalone, keyboard-friendly search + select list with customizable templates.

Key features:
- Debounced filtering by key paths (e.g., `['name', 'category.title']`)
- Custom templates for item/header/footer/empty states
- Keyboard navigation: ArrowUp/ArrowDown/Enter
- Public `focus()` API and click-to-focus container

#### Usage
```html
<ui-search-list
	[items]="products"
	[filterKeys]="['product_name', 'category.name']"
	[(query)]="productQuery"
	placeholder="Search products"
	trackByKey="id"
	(itemSelected)="onProductSelected($event)">

	<ng-template searchItemTemplate let-item>
		<div class="d-flex justify-content-between">
			<span>{{ item.product_name }}</span>
			<small class="text-muted">{{ item.sku }}</small>
		</div>
	</ng-template>

	<ng-template searchEmptyTemplate>
		<div class="text-muted small">No matching products</div>
	</ng-template>
</ui-search-list>
```

To focus from the parent:
```ts
import { ViewChild } from '@angular/core';
import { SearchListComponent } from '@version-20/shared-ui';

@ViewChild('productList') productList?: SearchListComponent<any>;

// later
this.productList?.focus();
```

#### Inputs
- `items: T[]`
- `filterKeys: string[]` (supports dot paths)
- `placeholder: string`
- `debounceMs: number` (default 200)
- `caseSensitive: boolean`
- `trackByKey?: string`
- `noResultText: string`
- `[(query)]: string`

#### Outputs
- `(itemSelected): T`
- `queryChange: string`

#### Template Directives
- `searchItemTemplate`
- `searchHeaderTemplate`
- `searchFooterTemplate`
- `searchEmptyTemplate`

Import paths are exposed via the workspace alias `@version-20/shared-ui`.

