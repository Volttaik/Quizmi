# Course data model

QUIZMI has **no in-app authoring, upload or admin screens**. Courses, questions
and answer options are written directly to the Turso database by the content
ingestion workflow. The application only reads published courses.

Schema lives in `lib/db/src/schema/index.ts`; versioned SQL lives in
`lib/db/migrations/`. Apply changes with
`pnpm --filter @workspace/scripts run db:migrate`.

## `courses`

| Column             | Type    | Notes                                                                 |
| ------------------ | ------- | --------------------------------------------------------------------- |
| `slug`             | text    | Required, unique. Lowercase letters, digits and hyphens.              |
| `title`            | text    | Required.                                                             |
| `code`             | text    | Optional course code as assigned by the institution, e.g. `GST 112`.  |
|                    |         | Catalogue search matches it case-insensitively and ignores spaces,    |
|                    |         | so `gst112` finds `GST 112`. NULL = no code; the app hides the chip.   |
| `description`      | text    | Shown on the course card and course page.                             |
| `subject`          | text    | Used for filtering and the analytics subject breakdown.               |
| `difficulty`       | text    | `easy`, `medium` or `hard`.                                           |
| `price_kobo`       | integer | Authoritative Paystack amount in kobo. `0` = free course.             |
| `currency`         | text    | `NGN` by default. Must match the Paystack currency.                   |
| `pass_score`       | integer | Percentage (0–100) required to pass. Defaults to 50.                  |
| `max_attempts`     | integer | NULL = unlimited attempts per learner.                                |
| `duration_minutes` | integer | Suggested timer. Learners still choose 10–60 minutes or unlimited.    |
| `question_count`   | integer | Cached count for lists — keep it equal to the inserted questions.     |
| `is_published`     | boolean | `1` lists the course in the catalogue.                                |
| `featured`         | boolean | `1` highlights the course on the homepage.                            |
| `cover_image_url`  | text    | Optional absolute image URL.                                          |

`id`, `created_at` and `updated_at` are managed by the database. Prices are
integers in the currency subunit (kobo for NGN); never store a formatted string.

## `questions`

| Column          | Type    | Notes                                                         |
| --------------- | ------- | ------------------------------------------------------------- |
| `course_id`     | integer | References `courses.id`.                                      |
| `prompt`        | text    | The question text.                                            |
| `options`       | JSON    | JSON array of 2–6 option strings.                             |
| `correct_index` | integer | **Zero-based** index into `options`.                          |
| `explanation`   | text    | Optional. Revealed only after submission.                     |
| `reference`     | text    | Optional source note, revealed only after submission.         |
| `image_url`     | text    | Optional absolute URL for a question image.                   |
| `marks`         | integer | Marks awarded for a correct answer. Defaults to 1.            |
| `order_index`   | integer | Presentation order (ascending).                               |
| `chapter_number`| integer | Chapter this question belongs to, as printed in the source    |
|                 |         | bank (1, 2, 3 …). `0` = unchaptered; the app hides its chapter |
|                 |         | controls for a bank with no chapters.                         |
| `chapter_title` | text    | Printed chapter heading, e.g. `Demand - Meaning, Law, …`.     |

The engine supports 1,000+ questions per course. It selects a random, unique
subset per attempt, stores the selected ids on the attempt, and only loads the
chosen questions in the browser.

## Chapters

Chapters live on `questions` (following Lumio's chapter model) — there is no
separate chapters table. `attempts.chapter_number` records what the attempt
practised (`NULL` = the whole course). Learners pick a chapter on the configure
screen or from the course page; the server then draws the attempt's questions
from that chapter only and validates that the chapter exists. The catalogue
course detail aggregates chapters with their question counts, and a course
whose questions all sit on chapter `0` simply shows no chapter controls.

Example ingestion with chapters:

```sql
INSERT INTO questions (
  course_id, prompt, options, correct_index, explanation,
  marks, order_index, chapter_number, chapter_title
) VALUES (
  :course_id, 'The law of demand states that…',
  '["Price and quantity move together","Price up, quantity down","Price down, quantity down","No relationship"]',
  1, 'Ceteris paribus, a higher price reduces quantity demanded.',
  1, 500, 6, 'Demand - Meaning, Law, Determinants, Types and Applications'
);
```

`scripts/src/ingest-decn101.ts` is a worked example: it parses
`scripts/content/decn101-questions.txt` (DECN 101, 1,000 questions in 10
chapters), validates every question against the printed answer index, and
writes the course and its bank idempotently. Run
`pnpm --filter @workspace/scripts run ingest:decn101 -- --parse-only` to
validate without writing.

`scripts/src/ingest-ecn102.ts` follows the same contract for ECN 102 –
Mathematical Economics: `scripts/content/ecn102-questions.txt` holds 500
questions in 5 chapters, the script validates every question against the
printed answer index and requires all 500 explanations, then upserts the course
(₦500, banner at `/ecn102/banner.webp`) and replaces its questions in one
batch. Re-running it updates course id in place — it never creates a second
course or duplicate questions. Use
`pnpm --filter @workspace/scripts run ingest:ecn102 -- --parse-only` to validate
without writing.

`scripts/src/ingest-soc103.ts` follows the same contract for SOC 103 –
Introduction to African Societies and Cultures: `scripts/content/soc103-questions.txt`
holds 1,000 questions in 11 chapters, the script validates every question against
the printed answer index and requires all 1,000 explanations, then upserts the
course (₦1,000, banner at `/soc103/banner.webp`) and replaces its questions in
page-sized batches. Re-running it updates the course row in place — it never
creates a second course or duplicate questions. Use
`pnpm --filter @workspace/scripts run ingest:soc103 -- --parse-only` to validate
without writing.

`scripts/src/ingest-dacn206.ts` follows the same contract for DACN 206 –
Laboratory Accounting: `scripts/content/dacn206-questions.txt` holds 600
questions in 6 chapters, the script validates every question against the printed
answer index and requires all 600 explanations, then upserts the course
(₦500, banner at `/dacn206/banner.webp`) and replaces its questions in
page-sized batches. It refuses to run when the same course code already exists
under a different slug. Re-running it updates the course row in place — it never
creates a second course or duplicate questions. Use
`pnpm --filter @workspace/scripts run ingest:dacn206 -- --parse-only` to validate
without writing.

## Example ingestion

```sql
BEGIN;

INSERT INTO courses (
  slug, title, description, subject, difficulty,
  price_kobo, currency, pass_score, max_attempts,
  duration_minutes, question_count, is_published, featured
) VALUES (
  'jamb-biology-2024',
  'JAMB Biology 2024',
  'Full-length biology practice paper with explanations.',
  'Biology', 'hard', 250000, 'NGN', 50, NULL, 30, 3, 1, 1
);

-- :course_id is the id returned by the insert above
INSERT INTO questions (course_id, prompt, options, correct_index, explanation, marks, order_index) VALUES
  (:course_id, 'Which organelle produces ATP?', '["Ribosome","Mitochondrion","Golgi body","Nucleus"]', 1, 'Mitochondria carry out oxidative phosphorylation.', 1, 0),
  (:course_id, 'Photosynthesis mainly occurs in the…', '["Root hair cells","Xylem","Chloroplast","Stomata"]', 2, NULL, 1, 1),
  (:course_id, 'Blood pH is buffered primarily by…', '["Haemoglobin","Bicarbonate","Glucose","Urea"]', 1, 'The bicarbonate buffer system.', 1, 2);

UPDATE courses SET question_count = 3 WHERE id = :course_id;

COMMIT;
```

## Rules

- Never expose `correct_index`, `explanation` or `reference` to the browser
  before an attempt is submitted. The app strips them in `lib/attempts.ts`;
  keep answer data in `questions` only.
- Do not write to `attempts`, `payments` or `purchases`. Those are owned by the
  exam engine and payment verification. Purchases are created only after the
  server verifies a Paystack transaction.
- Keep `question_count` in sync when inserting questions. The catalogue uses the
  cached value; the engine always counts rows before allowing an attempt.
- Publish a course only when it has questions. A course with zero questions is
  shown, but cannot be started.
- Paid courses require `price_kobo > 0` and a valid `currency`. Free courses use
  `price_kobo = 0`.
