/**
 * Repairs stored attempt results so history and analytics describe reality.
 *
 * Two defects from earlier versions of the runner are corrected:
 *
 *   1. Attempts that closed without a single recorded answer were stored as
 *      `expired`/`terminated` with 0 marks, which analytics counted as a real
 *      0% result. They become `not_submitted`: kept in history, no score.
 *   2. Some attempts stored `total_marks` for only the answered questions (a
 *      20-question paper recorded as "out of 1"), which broke percentages.
 *      Marks, score and percentage are recomputed from the stored answer sheet
 *      and the attempt's own question set.
 *
 * The script only reads the answer sheet that was already scored — it never
 * re-grades against the current answer key, so historical results stay exactly
 * as the learner saw them. It is idempotent: a second run reports zero changes.
 *
 *   Preview without writing:
 *     pnpm --filter @workspace/scripts run repair:attempts -- --dry-run
 *
 *   Apply:
 *     pnpm --filter @workspace/scripts run repair:attempts
 */
import { createClient } from "@libsql/client";
import "./env";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("TURSO_DATABASE_URL is not set.");
  process.exit(1);
}

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const dryRun = process.argv.includes("--dry-run");

type StoredAnswer = { questionId: number; selectedIndex: number | null; correct?: boolean; marksAwarded?: number };

type AttemptRow = {
  id: number;
  status: string;
  question_ids: string;
  answers: string;
  score: number;
  total_marks: number;
  percentage: number;
  passed: number;
  pass_score: number;
};

const GRADED = new Set(["submitted", "expired", "terminated"]);

async function main() {
  const marks = new Map<number, number>();
  const questionRows = await client.execute({ sql: "SELECT id, marks FROM questions", args: [] });
  for (const row of questionRows.rows) {
    const marksValue = Number(row.marks);
    marks.set(Number(row.id), Number.isFinite(marksValue) && marksValue > 0 ? marksValue : 1);
  }

  const attempts = await client.execute({
    sql: `SELECT a.id, a.status, a.question_ids, a.answers, a.score, a.total_marks,
                 a.percentage, a.passed, c.pass_score
          FROM attempts a
          JOIN courses c ON c.id = a.course_id
          ORDER BY a.id`,
    args: [],
  });

  const updates: Array<{
    id: number;
    sql: string;
    args: Array<string | number | null>;
    reason: string;
  }> = [];
  let abandoned = 0;
  let repaired = 0;

  for (const raw of attempts.rows) {
    const attempt = raw as unknown as AttemptRow;
    const answers = parseAnswers(attempt.answers);
    const questionIds = parseIds(attempt.question_ids);
    const answeredCount = answers.filter(
      (answer) => answer.selectedIndex !== null && answer.selectedIndex !== undefined
    ).length;

    if (answeredCount === 0 && (GRADED.has(attempt.status) || attempt.status === "not_submitted")) {
      if (attempt.status === "not_submitted" && Number(attempt.passed) === 0 && Number(attempt.score) === 0) {
        continue;
      }
      abandoned += 1;
      updates.push({
        id: attempt.id,
        reason: "closed with no answers → not_submitted",
        sql: `UPDATE attempts
              SET status = 'not_submitted', score = 0, total_marks = 0, percentage = 0,
                  passed = 0, time_taken_seconds = NULL
              WHERE id = ?`,
        args: [attempt.id],
      });
      continue;
    }

    if (!GRADED.has(attempt.status)) continue;

    const totalMarks = questionIds.reduce((sum, id) => {
      const value = marks.get(id);
      return sum + (value ?? 1);
    }, 0);
    const score = answers.reduce((sum, answer) => sum + (answer.marksAwarded ?? 0), 0);
    if (totalMarks <= 0) continue;

    const percentage = Math.round((score / totalMarks) * 100);
    const passed = percentage >= Number(attempt.pass_score) ? 1 : 0;

    if (
      Number(attempt.total_marks) === totalMarks &&
      Number(attempt.score) === score &&
      Number(attempt.percentage) === percentage &&
      Number(attempt.passed) === passed
    ) {
      continue;
    }

    repaired += 1;
    updates.push({
      id: attempt.id,
      reason: `marks ${attempt.score}/${attempt.total_marks} → ${score}/${totalMarks}, ${attempt.percentage}% → ${percentage}%`,
      sql: `UPDATE attempts
            SET score = ?, total_marks = ?, percentage = ?, passed = ?
            WHERE id = ?`,
      args: [score, totalMarks, percentage, passed, attempt.id],
    });
  }

  for (const update of updates) {
    console.log(`attempt ${update.id}: ${update.reason}`);
  }

  if (dryRun) {
    console.log(
      `dry run: ${abandoned} attempt(s) would become not_submitted, ${repaired} result(s) would be recomputed`
    );
    client.close();
    return;
  }

  if (updates.length > 0) {
    await client.batch(
      updates.map((update) => ({ sql: update.sql, args: update.args })),
      "write"
    );
  }

  console.log(
    `repaired ${abandoned} unsubmitted attempt(s) and ${repaired} stored result(s); ${attempts.rows.length} attempt(s) scanned`
  );
  client.close();
}

function parseAnswers(value: unknown): StoredAnswer[] {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? (parsed as StoredAnswer[]) : [];
  } catch {
    return [];
  }
}

function parseIds(value: unknown): number[] {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? parsed.map((id) => Number(id)).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

main().catch((error) => {
  console.error("attempt repair failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
