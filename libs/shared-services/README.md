# Shared Services Library

Cross-application Angular services and tokens.

## API Service
Lightweight HTTP wrapper that uses an injected base URL.

### Provide Base URL
```ts
import { bootstrapApplication, provideHttpClient } from '@angular/platform-browser';
import { API_BASE_URL } from '@version-20/shared-services';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
	providers: [
		provideHttpClient(),
		{ provide: API_BASE_URL, useValue: 'http://localhost:8080/api' } // or environment.apiUrl
	]
});
```

### Use in Components/Services
```ts
import { inject } from '@angular/core';
import { ApiService } from '@version-20/shared-services';

const api = inject(ApiService);
api.get<Product[]>('products').subscribe((rows) => {
	// handle data
});

// api.post<T>('endpoint', payload)
```

Exports are available via the alias `@version-20/shared-services`.

