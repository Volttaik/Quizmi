# Quizmi

A focused quiz and computer-based examination platform. Students browse the
quiz library, take timed or untimed exams with full question navigation, and
review scored results, answer explanations and performance analytics.

There is no quiz authoring, AI generation, marketplace or admin surface in the
app. Quiz content is inserted directly into the database — see
`docs/quiz-data.md` for the ingestion contract.

## Run & Operate

- `pnpm --filter @workspace/questly run dev` — Next.js app (port 3000)
- `pnpm run typecheck` — typecheck every package
- `pnpm run build` — typecheck + build
- `pnpm --filter @workspace/db run push` — sync the Drizzle schema (dev)
- `pnpm --filter @workspace/scripts run migrate:quiz` — normalise legacy JSON
  quizzes into the new question model and backfill old attempt results
- Required env: `TURSO_DATABASE_URL` (or `DATABASE_URL`) and `TURSO_AUTH_TOKEN`
- Required env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

## Stack

- pnpm workspaces, Node.js, TypeScript 5.9
- Next.js 15 App Router, Tailwind CSS v4, Radix/shadcn primitives, Clerk
- Drizzle ORM on Turso/libSQL (SQLite dialect)
- Recharts for the score-trend chart
- Express service in `artifacts/api-server` is a health endpoint only; the web
  app serves its own API routes

## Where things live

- `artifacts/questly/` — Next.js app (`@workspace/questly`)
  - `src/views/` — page components (home, catalogue, quiz launch, dashboard,
    exam runner, result, history, profile)
  - `src/app/api/` — route handlers (`quizzes`, `attempts`, `dashboard`,
    `analytics`, `me`)
  - `src/lib/attempts.ts` — attempt lifecycle: start/resume, drafts, expiry,
    server-side scoring and result review
  - `src/lib/scoring.ts` — pure scoring, timer and attempt-limit helpers
  - `src/lib/quiz.ts`, `src/lib/stats.ts` — catalogue and analytics queries
- `lib/db/` — Drizzle schema and client (`@workspace/db`)
- `artifacts/quizmi-mobile/` — legacy Expo client from the previous product; not
  part of this release and still pointed at the removed AI/credit endpoints
- `scripts/src/migrate-legacy-quiz-data.ts` — one-off data migration
- `docs/quiz-data.md` — schema reference for the quiz ingestion workflow

## Architecture decisions

- **Server-authoritative exams.** The client never receives `correct_index`,
  `explanation` or `reference` while an attempt is open. Submission is scored on
  the server and results (with explanations) are only returned afterwards.
- **Timers are enforced server-side.** A timed attempt stores `expires_at`;
  loading or submitting after the deadline closes the attempt as `expired` and
  scores the last saved draft.
- **Drafts autosave.** The runner PATCHes the attempt as answers change, so a
  refresh restores progress. Question order for shuffled quizzes is derived from
  the attempt id, so it is stable across reloads.
- **Attempt limits are enforced at start.** `max_attempts` counts every attempt
  for that quiz, including in-progress ones.
- **Access codes.** Quizzes with `pass_key` require the code to start an attempt;
  the catalogue only shows that a code is needed.
- **Content is read-only.** Publishing a quiz means setting `is_public = 1` and
  inserting its questions. The app has no authoring endpoints.
- **Legacy data is preserved.** Old AI/flashcard/credit tables are still declared
  in the schema (so a sync never drops them) but are not read by the app.

## Product

The catalogue lists published quizzes with subject, difficulty, question count,
time limit, attempt allowance and personal best. The exam runner supports
1,000+ questions with a paginated question map, keyboard shortcuts, autosave,
server timers and explicit submission. Results include pass/fail, marks, time
taken, per-question review and explanations; history adds score trends, pass rate
and subject breakdown.

## Gotchas

- `next build` needs valid Clerk keys; the marketing, catalogue and quiz-launch
  pages are public, everything else requires sign-in.
- Public routes are allow-listed in `src/middleware.ts` (`/`, `/quizzes(.*)`,
  `/api/quizzes(.*)`, sign-in/up). Add new public routes there.
- After changing `lib/db/src/schema/index.ts`, run `pnpm --filter @workspace/db
  run push` before exercising the app.
- Run the `migrate:quiz` script once against an existing database before
  deploying this version.
