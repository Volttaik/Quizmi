# Quiz data model

Quizmi has **no in-app authoring, upload or admin screens**. Quizzes and
questions are written directly to the database by the content ingestion
workflow. The application only reads published quizzes.

These tables live in `lib/db/src/schema/index.ts` (Turso/libSQL, SQLite dialect).

## `quizzes`

| Column              | Type    | Notes                                                                 |
| ------------------- | ------- | --------------------------------------------------------------------- |
| `title`             | text    | Required.                                                             |
| `share_slug`        | text    | Required, unique. Lowercase letters, digits and hyphens, e.g. `jamb-biology-2024`. |
| `description`       | text    | Shown on the quiz card and launch screen.                             |
| `subject_name`      | text    | Used for filtering and the analytics subject breakdown.               |
| `difficulty`        | text    | `easy`, `medium` or `hard`.                                           |
| `duration_minutes`  | integer | NULL = untimed. Otherwise the time limit for one full attempt.        |
| `pass_score`        | integer | Percentage (0–100) required to pass. Defaults to 50.                  |
| `max_attempts`      | integer | NULL = unlimited.                                                     |
| `shuffle_questions` | boolean | `1` to present a per-attempt shuffled order.                          |
| `pass_key`          | text    | NULL = open quiz. Otherwise students must enter this access code.     |
| `question_count`    | integer | Cached count shown in lists — keep it equal to the inserted questions. |
| `is_public`         | boolean | `1` publishes the quiz in the library.                                |

`id`, `created_at` and `updated_at` are managed by the database. The remaining
columns (`topic`, `user_id`, `quiz_type`, `questions`) are legacy fields from
the previous product and are ignored by the app.

## `questions`

| Column         | Type    | Notes                                                        |
| -------------- | ------- | ------------------------------------------------------------ |
| `quiz_id`      | integer | References `quizzes.id`.                                     |
| `prompt`       | text    | The question text.                                           |
| `options`      | JSON    | JSON array of 2–6 option strings, e.g. `["A","B","C","D"]`.   |
| `correct_index`| integer | **Zero-based** index into `options`.                          |
| `explanation`  | text    | Optional. Revealed only after submission.                    |
| `reference`    | text    | Optional source note, revealed only after submission.        |
| `image_url`    | text    | Optional absolute URL for a question image.                  |
| `marks`        | integer | Marks awarded for a correct answer. Defaults to 1.           |
| `order_index`  | integer | Presentation order (ascending).                              |

Quizzes support at least 1,000 questions; the exam UI paginates the question map
and the API returns questions without answers.

## Example ingestion

```sql
BEGIN;

INSERT INTO quizzes (
  title, share_slug, description, subject_name, difficulty,
  duration_minutes, pass_score, max_attempts, shuffle_questions,
  pass_key, question_count, is_public
) VALUES (
  'JAMB Biology 2024', 'jamb-biology-2024',
  'Full-length timed biology practice paper.',
  'Biology', 'hard', 90, 50, NULL, 0, NULL, 3, 1
);

-- :quiz_id is the id returned by the insert above
INSERT INTO questions (quiz_id, prompt, options, correct_index, explanation, marks, order_index) VALUES
  (:quiz_id, 'Which organelle produces ATP?', '["Ribosome","Mitochondrion","Golgi body","Nucleus"]', 1, 'Mitochondria carry out oxidative phosphorylation.', 1, 0),
  (:quiz_id, 'Photosynthesis mainly occurs in the…', '["Root hair cells","Xylem","Chloroplast","Stomata"]', 2, NULL, 1, 1),
  (:quiz_id, 'Blood pH is buffered primarily by…', '["Haemoglobin","Bicarbonate","Glucose","Urea"]', 1, 'The bicarbonate buffer system.', 1, 2);

COMMIT;
```

## Rules

- Never expose `correct_index`, `explanation` or `reference` to the browser
  before an attempt is submitted. The app strips them in `lib/attempts.ts`;
  keep answer data in `questions` only.
- Do not write to `quiz_attempts`. It is owned by the exam engine and stores
  per-user drafts, scores and review data.
- Keep `question_count` in sync with the number of `questions` rows; lists use
  the cached value for display while the engine always counts rows.
- Retired social quiz types are unpublished by
  `pnpm --filter @workspace/scripts run migrate:quiz`, which also normalises
  legacy JSON quizzes into `questions` and backfills old attempt scores.
