# Quizmi

An AI-powered study platform that transforms educational materials into interactive quizzes, flashcards, and summaries.

## Run & Operate

- `pnpm --filter @workspace/questly run dev` — run the Next.js frontend (port 3000)
- `pnpm --filter @workspace/api-server run dev` — run the Express API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres/LibSQL connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: Next.js 15 (App Router), Tailwind CSS, Radix UI, Clerk Auth
- API: Express 5
- DB: PostgreSQL/LibSQL + Drizzle ORM
- AI: Groq SDK (quiz/summary generation)
- Payments: Paystack
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/questly/` — Next.js frontend app (`@workspace/questly`)
- `artifacts/api-server/` — Express backend (`@workspace/api-server`)
- `lib/db/` — Drizzle ORM schema and DB client (`@workspace/db`)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-zod/` — Generated Zod schemas (`@workspace/api-zod`)
- `lib/api-client-react/` — Generated React Query hooks (`@workspace/api-client-react`)

## Architecture decisions

- OpenAPI-first: all API contracts are defined in `lib/api-spec/openapi.yaml`; React hooks and Zod schemas are generated via Orval — never hand-write these
- Clerk handles all auth in the Next.js app; the API server validates Clerk tokens
- Drizzle ORM is the single source of truth for DB schema; run `pnpm --filter @workspace/db run push` to sync changes

## Product

Quizmi lets students upload study materials and automatically generates quizzes, flashcards, and summaries using AI (Groq). Users can review flashcards, take quizzes, and track their progress through a dashboard.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run codegen before building the frontend
- The Next.js app uses the App Router — pages live in `artifacts/questly/src/app/`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
