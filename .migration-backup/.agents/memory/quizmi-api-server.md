---
name: Quizmi API server setup
description: Key decisions for the Quizmi (Questly) api-server artifact — no workspace packages, all DB and AI code inlined.
---

# Quizmi API server — durable decisions

## No separate @workspace/db or @workspace/api-zod packages
**Why:** The pnpm-workspace.yaml only includes `artifacts/*`, `lib/*`, `lib/integrations/*`, and `scripts`. There is no `packages/*` glob. The original backup had workspace packages but they were never ported.

**How to apply:** Keep all DB schema, Drizzle connection, and Gemini AI helpers inside `artifacts/api-server/src/lib/`. Do NOT create `packages/db` or `packages/api-zod` — they won't be resolved.

## Database schema location
`artifacts/api-server/src/lib/db.ts` — Drizzle ORM with node-postgres pool. Schema: users, quizzes, quiz_attempts, flashcard_sets, summaries, credit_transactions. Tables auto-created via `ensureTablesExist()` called from app.ts at startup.

## Route mounting
`app.ts` mounts all routes at `/api` (`app.use("/api", router)`). Route files must use paths WITHOUT the `/api/` prefix (e.g., `/user` not `/api/user`).

## health.ts fix
Original health.ts imported from `@workspace/api-zod`. Replaced with inline `z.object({ status: z.string() })`. Never restore the workspace import.
