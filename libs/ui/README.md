# UI Library (Basic)

Minimal set of standalone Angular UI components used experimentally across the workspace.

## Available Components
- `Ui` – base placeholder component (`selector: lib-ui`)

### Usage
```ts
import { Component } from '@angular/core';
import { Ui } from '@version-20/ui';

@Component({
	standalone: true,
	imports: [Ui],
	template: '<lib-ui />',
})
export class Demo {}
```

Note: Additional files like `data-table`, `dynamic-form`, and `print-table` exist but are not exported from the public API yet.

