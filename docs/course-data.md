# Course data model

Quizme has **no in-app authoring, upload or admin screens**. Courses, questions
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

The engine supports 1,000+ questions per course. It selects a random, unique
subset per attempt, stores the selected ids on the attempt, and only loads the
chosen questions in the browser.

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
