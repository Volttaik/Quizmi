---
name: Quizmi DB Pattern
description: How the API server connects to PostgreSQL — must use @workspace/db, never import pg directly.
---

# Quizmi DB Pattern

The API server (`artifacts/api-server`) must import `db` and `pool` from `@workspace/db`, never import `pg` directly.

**Why:** esbuild bundles the api-server and cannot resolve `pg` when imported directly in api-server code — `pg` is only a dependency of `lib/db`, not of `api-server`. Importing it directly causes: `Could not resolve "pg"` build error.

**How to apply:**
```typescript
// CORRECT
import { db, pool } from "@workspace/db";

// WRONG — causes build error
import pg from "pg";
const pool = new pg.Pool(...);
```

The `@workspace/db` package exports: `db` (drizzle instance), `pool` (pg Pool), and all schema tables.
