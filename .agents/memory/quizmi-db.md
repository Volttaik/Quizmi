---
name: Quizmi DB Pattern
description: How the API server connects to the database — now Turso/libsql, native binary quirks, and dev fallback.
---

# Quizmi DB Pattern

The project migrated from PostgreSQL to Turso (libsql + drizzle-orm/libsql).

## Native Binary Fix (libsql on Replit)

`@libsql/linux-x64-gnu` is in the pnpm store but not auto-linked to workspace `node_modules`. Must be manually symlinked:
```bash
mkdir -p node_modules/@libsql
ln -sf node_modules/.pnpm/@libsql+linux-x64-gnu@0.4.7/node_modules/@libsql/linux-x64-gnu node_modules/@libsql/linux-x64-gnu
ln -sf node_modules/.pnpm/libsql@0.4.7/node_modules/libsql node_modules/libsql
```

These symlinks are NOT committed and must be recreated after `pnpm install`. The `onlyBuiltDependencies` in `pnpm-workspace.yaml` includes `libsql`.

**Why:** pnpm virtual store doesn't expose optional native packages to workspace root automatically; the dist bundle resolves from `artifacts/api-server/dist/` so it needs the binary in workspace root `node_modules`.

## build.mjs External List

`@libsql/linux-x64-gnu`, `@libsql/linux-x64-musl`, `@libsql/linux-arm64-gnu`, `@libsql/linux-arm64-musl` are added to esbuild externals in `artifacts/api-server/build.mjs` so the native binary is resolved at runtime, not bundled.

**Do NOT add `libsql` itself to externals** — esbuild must bundle it, otherwise Node.js can't find it from the `dist/` directory.

## TURSO_DATABASE_URL

`lib/db/src/index.ts` uses `TURSO_DATABASE_URL` (cloud Turso) and falls back to `file:./dev.db` for local development. It must **never** fall back to `DATABASE_URL` (PostgreSQL) — that URL has `?sslmode=require` which libsql rejects with `URL_PARAM_NOT_SUPPORTED`.

## Import Pattern

API server imports from `@workspace/db`:
```typescript
import { db, client } from "@workspace/db";
import { users, quizzes } from "@workspace/db";
```
