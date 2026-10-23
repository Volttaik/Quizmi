# QUIZMI

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
- `pnpm --filter @workspace/scripts run ingest:decn101` — parse and ingest the
  DECN 101 course and its 1,000-question chapter bank (add `-- --parse-only` to
  validate the source file without writing, `-- --price-kobo N` to reprice)
- `pnpm --filter @workspace/scripts run ingest:ecn102` — parse and ingest the
  ECN 102 course and its 500-question, 5-chapter bank (same flags; ₦500 by
  default, re-runs update the course in place and replace its questions)
- `pnpm --filter @workspace/scripts run repair:attempts` — re-derive stored
  attempt results from their own answer sheets and move answer-less closed
  attempts to `not_submitted` (idempotent; `-- --dry-run` previews)

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
  - `src/app/(shell)/` — shared header/bottom-nav shell for primary screens
  - `src/app/(shell)/courses/` — public course routes
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
  - `src/lib/attempt-status.ts` — the canonical attempt statuses and their rules
  - `src/lib/attempt-summary.ts` — pure answer counts, per-course attempt
    numbering/grouping and analytics, shared by history, results and dashboard
  - `src/lib/stats.ts` — history, dashboard and analytics queries
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
- **One attempt-status model.** `in_progress`, `submitted`, `expired`,
  `terminated` and `not_submitted` are defined once in
  `src/lib/attempt-status.ts`. Only `submitted`, `expired` and `terminated` are
  graded: they are the only statuses with a score, a percentage and a pass
  verdict, and the only ones analytics, course attempt counts and attempt
  limits use. `not_submitted` records an attempt that was opened but never
  produced a result; it stays in history (and keeps its saved answers) without
  ever being shown as 0/0 or counted as completed.
- **Closed attempts are never deleted or fabricated.** Starting a new attempt
  for a course abandons the open draft instead of deleting it, and a timed-out
  attempt with no recorded answer becomes `not_submitted` rather than a 0-mark
  "expired" result. A submit payload that arrives empty is ignored in favour of
  the saved draft, so a repeated or truncated request cannot wipe an answer
  sheet.
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

- Homepage: a "marked paper" hero — headline, hall-ticket search slip, a
  CSS-only answer-sheet motif (`AnswerSheetStage`) and real catalogue counts —
  followed by subject filters, real course cards and empty/error/loading states.
  No device mockups and no invented statistics.
- Navigation: the `(shell)` layout keeps one header and one bottom navigation
  mounted across home, my-courses, courses, course details, dashboard, history,
  profile, results and settings. The exam runner keeps its dedicated layout.
- My Courses (`/my-courses` + `/api/my-courses`): only rows from the verified
  `purchases` table, with real thumbnails, purchase dates and resume/start
  shortcuts, plus an Explore Courses empty state.
- Shareable results: the results screen renders a branded 1080×1080 achievement
  card on a canvas from the persisted attempt (`src/lib/share-card.ts`), with a
  QR code to the public course page. Web Share API file sharing is used when
  available; the fallback sheet offers image download, WhatsApp (message +
  course link) and copy. The link is an invitation to view/purchase — it never
  grants access.
- Instant quiz feedback: the attempt PATCH grades first-time answers on the
  server (once per question, never re-graded, final score still computed at
  submission) so the runner can show correct/incorrect feedback, streaks at
  3/5/7/10 and a dismissable study nudge after ten consecutive wrong answers.
  The reveal is QUIZMI's own marked-paper motif (`AnswerReveal`): an ink stamp
  with tick shards for a correct answer, an eraser swipe and revise tag for a
  wrong one. All motion respects `prefers-reduced-motion`.
- Session resilience: quiz API calls go through `requestWithSession`, which
  force-refreshes the Clerk token and retries once on 401, retries the
  retryable `session_unavailable` 503, and only then reports a sign-out. The
  runner keeps the token warm, never auto-navigates away from an attempt, and
  shows `SessionRecovery` so a recovered session resumes the same quiz.
  Refreshing the tab no longer records a departure.
- Course sharing: every course card and the course page expose a share action
  (`ShareCourseButton`) using the Web Share API where available and a clipboard
  fallback otherwise. Links point at `/courses/<slug>`, which is public and
  still enforces the purchase check, and course pages emit share metadata.
- Course page: description, price, purchase state, question count, timer choice
  (10–60 minutes or unlimited) and start/resume. Course cards and the detail
  page show the optional institution course code (e.g. "GST 112") and banner
  when the ingested row provides them.
- Chapters: banks ingested with `chapter_number`/`chapter_title` (see
  `docs/course-data.md`) get a chapter picker on the configure screen and a
  chapters list on the course page, so a learner can practise one chapter or
  the whole course. The chapter is chosen client-side but validated and applied
  server-side when the attempt starts; results record which chapter was
  practised. DECN 101 (1,000 questions in 10 chapters) is ingested this way by
  `scripts/src/ingest-decn101.ts`.
- Discovery: catalogue search matches the stored course name, subject,
  description and course code (case-insensitive; code matching ignores spaces,
  so "GST112" finds "GST 112"). There is intentionally no difficulty filter —
  courses are identified by name and code, not level.
- Exam runner: question map with pagination, keyboard shortcuts, incremental
  autosave, answer progress, server countdown, submission confirmation and
  termination handling.
- Results: score, pass/fail, time taken, termination/expiry reason, then a
  per-question review of that exact attempt — the question, every option, the
  learner's choice, the correct answer, whether it was correct, incorrect or
  left blank, the chapter, and the explanation. Filters separate incorrect
  from unanswered questions. Attempts that were never submitted show an
  explicit "not submitted" panel with no score, never 0/0.
- History (`/history` + `/api/attempts`): attempts are grouped by course and
  numbered in the order they were taken, each with its status, date, score,
  correct/incorrect/unanswered counts, answered count, time taken and a link to
  that attempt's own result. Stat tiles, the score trend and subject averages
  come from graded attempts only; a learner with no attempts gets an empty
  state rather than zeros.
- Dashboard: purchased courses, in-progress attempts, recent results and
  analytics derived from persisted records only. Graded attempts drive the
  score tiles; unfinished attempts are counted separately.
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
