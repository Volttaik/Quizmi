---
name: Vite config env var fallbacks
description: The react-vite scaffold throws hard errors if PORT or BASE_PATH aren't set; safe fix is to add defaults.
---

The scaffolded `vite.config.ts` throws `Error: PORT environment variable is required` and `Error: BASE_PATH environment variable is required` if those env vars aren't injected by the platform before the dev server starts.

**Why:** The platform injects PORT/BASE_PATH at workflow start, but timing can differ. Hard throws prevent any fallback.

**How to apply:** Replace the throw-on-missing pattern with nullish coalescing defaults:
```ts
const rawPort = process.env.PORT ?? "20698";   // use the artifact's assigned port
const port = Number(rawPort);
const basePath = process.env.BASE_PATH ?? "/"; // use the artifact's previewPath
```
This makes the dev server start reliably even if env vars aren't injected yet.
