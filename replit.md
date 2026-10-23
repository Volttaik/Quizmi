# Quizme

A course-based computer-based testing platform. Learners browse a real course
catalogue, purchase access through Paystack, choose how many questions to
attempt and which timer to use, then take a server-timed CBT assessment. Results,
answer reviews, attempt history and performance analytics are saved per learner.

There is no quiz authoring, AI generation, marketplace or admin surface in the
app. Course and question content is inserted directly into Turso — see
`docs/course-data.md` for the ingestion contract.

## Run & Operate

- `pnpm --filter @workspace/questly run dev` — Next.js app (port 3000)
- `pnpm run typecheck` — typecheck the web app and scripts
- `pnpm run build` — typecheck + build the web app
- `pnpm --filter @workspace/scripts run db:migrate` — apply versioned Turso migrations
- `pnpm --filter @workspace/scripts run db:verify` — check connection and schema
- `pnpm --filter @workspace/scripts run db:verify -- --write` — also test a real write
  (inserts, reads and deletes a temporary course row; opt-in so it is not run
  against production by accident)

### Required environment

Server-side (never exposed to the browser):

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `CLERK_SECRET_KEY`
- `PAYSTACK_SECRET_KEY`

Browser-safe:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL` (public origin used for Paystack callback URLs)

Local development reads `artifacts/questly/.env.local`; see
`artifacts/questly/.env.example`. Turso is the only database — there is no
SQLite, in-memory or mock fallback.

## Stack

- pnpm workspaces, Node.js, TypeScript 5.9
- Next.js 15 App Router, Tailwind CSS v4, Radix/shadcn primitives, Clerk
- Drizzle ORM on Turso/libSQL (SQLite dialect)
- Recharts for the score-trend chart
- Paystack hosted checkout (server-initialized and server-verified)

## Where things live

- `artifacts/questly/` — Next.js app (`@workspace/questly`)
  - `src/views/` — home, course catalogue, course detail/launch, dashboard,
    exam runner, result, history, profile
  - `src/app/courses/` — public course routes
  - `src/app/api/courses/` — course listing and detail
  - `src/app/api/attempts/` — start/resume, draft saves, heartbeat, departure
    events, submission and results
  - `src/app/api/payments/` — Paystack initialize, callback and webhook
  - `src/lib/courses.ts` — catalogue, entitlements and course detail
  - `src/lib/attempts.ts` — attempt lifecycle, question selection, timers,
    server-side scoring, departure policy
  - `src/lib/purchases.ts` — idempotent payment intents and fulfilment
  - `src/lib/paystack.ts` — Paystack API and webhook signature verification
  - `src/lib/scoring.ts` — pure scoring, timer and answer sanitising helpers
  - `src/lib/stats.ts` — dashboard and analytics queries
- `lib/db/src/schema/index.ts` — Drizzle schema
- `lib/db/migrations/` — versioned SQL migrations
- `scripts/src/migrate.ts` — checksummed migration runner
- `docs/course-data.md` — content ingestion contract
- `artifacts/quizmi-mobile/` — legacy Expo client from the previous product; not
  part of this release and excluded from the root build/typecheck

## Architecture decisions

- **Courses are the product.** A published course owns a question bank, a price
  in kobo, a pass mark, optional attempt limit and an optional suggested timer.
  The catalogue only reads real database rows and shows a proper empty state.
- **Access is server-enforced.** Starting or resuming an attempt checks for a
  verified purchase (or a free course) on the server. Hidden buttons are not an
  authorization mechanism.
- **Paystack fulfilment is idempotent.** The server initializes the transaction
  with the authoritative course price, then verifies the transaction through
  Paystack before writing `payments` and `purchases`. The unique
  `(user_id, course_id)` index and unique payment reference make repeated
  callbacks and webhooks safe. A browser redirect never grants access.
- **Attempts select a stable subset.** Random unique question ids are chosen at
  start and stored on the attempt, so a 1,000-question course only loads the
  chosen subset. Question order is stable across refreshes.
- **Timers are server-authoritative.** The selected duration is stored with the
  attempt and becomes `expires_at`; unlimited attempts have no deadline.
  Loading, saving or submitting after the deadline closes the attempt as
  `expired` and scores the last saved draft.
- **Drafts autosave incrementally.** The runner sends only changed answers, so
  large attempts do not resend the full answer map on every click. A refresh
  restores saved answers.
- **Departures are persisted on the server.** The first two confirmed departures
  produce a warning; the third sets the attempt to `terminated`, scores the last
  draft and prevents resuming. Deduplication prevents one navigation's
  `visibilitychange` and `pagehide` from counting twice. The server remains the
  authority for the count and for whether the attempt can resume.
- **Browser limitations are real.** JavaScript cannot guarantee detection of
  every departure (for example, another app on the device). The app records the
  strongest signals available and documents the limitation rather than claiming
  perfect proctoring.
- **No content mutations in the app.** Publishing a course means inserting its
  rows and setting `is_published = 1`; there are no authoring endpoints.

## Product notes

- Homepage: real course search, subject filters, course cards, empty/error/loading
  states, no simulated exams or invented statistics.
- Course page: description, price, purchase state, question count, timer choice
  (10–60 minutes or unlimited) and start/resume.
- Exam runner: question map with pagination, keyboard shortcuts, incremental
  autosave, answer progress, server countdown, submission confirmation and
  termination handling.
- Results: score, pass/fail, time taken, termination/expiry reason, paginated
  answer review with explanations only after submission.
- Dashboard/history: purchased courses, in-progress attempts, recent results and
  analytics derived from persisted records only.
- Light/dark themes are applied across public pages, auth, dashboard, exam,
  dialogs and results.

## Gotchas

- `next build` needs valid Clerk keys. Public routes are allow-listed in
  `src/middleware.ts`; add new public routes there.
- After editing `lib/db/src/schema/index.ts`, add a new SQL migration rather than
  editing an applied one — the migration runner stores checksums.
- Do not run `drizzle-kit push` against production; it is not the versioned path.
- Paystack callback and webhook URLs must be reachable publicly. Set
  `NEXT_PUBLIC_APP_URL` to the deployed origin so callbacks redirect correctly.
- The callback route verifies the reference; the webhook verifies the
  `x-paystack-signature` HMAC before fulfilling.
