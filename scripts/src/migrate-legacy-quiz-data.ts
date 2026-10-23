/**
 * Migrates the legacy Quizmi data model into the CBT schema.
 *
 *   • The old `quizzes.questions` JSON blob is expanded into the `questions`
 *     table so existing quizzes become playable in the new exam engine.
 *   • Legacy `quiz_attempts` rows (score/total/completed_at) are backfilled with
 *     percentage, pass state and submission time so history stays accurate.
 *   • Retired social quiz types (love, friendship, family, personality, knowme,
 *     classroom) are unpublished rather than deleted, so no attempt history is
 *     lost.
 *
 * Safe to re-run: quizzes that already have rows in `questions` are skipped and
 * already-migrated attempts are left untouched.
 *
 * Usage: pnpm --filter @workspace/scripts run migrate:quiz
 */
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db, attemptsTable, questionsTable, quizzesTable } from "@workspace/db";

const RETIRED_QUIZ_TYPES = new Set([
  "love",
  "friendship",
  "family",
  "personality",
  "knowme",
  "classroom",
]);

type LegacyQuestion = {
  question?: string;
  options?: string[];
  correct?: number;
  explanation?: string;
  reference?: string;
};

async function main() {
  const quizzes = await db.select().from(quizzesTable);
  let migratedQuestions = 0;
  let migratedQuizzes = 0;
  let retiredQuizzes = 0;

  for (const quiz of quizzes) {
    if (quiz.quizType && RETIRED_QUIZ_TYPES.has(quiz.quizType)) {
      if (quiz.isPublished) {
        await db
          .update(quizzesTable)
          .set({ isPublished: false })
          .where(eq(quizzesTable.id, quiz.id));
        retiredQuizzes += 1;
      }
      continue;
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(questionsTable)
      .where(eq(questionsTable.quizId, quiz.id));
    if (Number(count) > 0) continue;

    const legacy = Array.isArray(quiz.questions) ? (quiz.questions as LegacyQuestion[]) : [];
    if (legacy.length === 0) continue;

    const rows = legacy
      .map((question, index) => ({
        quizId: quiz.id,
        prompt: String(question.question ?? "").trim() || `Question ${index + 1}`,
        options: Array.isArray(question.options) ? question.options.map(String) : [],
        correctIndex:
          Number.isInteger(question.correct) && Number(question.correct) >= 0
            ? Number(question.correct)
            : 0,
        explanation: question.explanation ?? null,
        reference: question.reference ?? null,
        marks: 1,
        orderIndex: index,
      }))
      .filter((row) => row.options.length >= 2);

    if (rows.length === 0) continue;

    for (let offset = 0; offset < rows.length; offset += 200) {
      await db.insert(questionsTable).values(rows.slice(offset, offset + 200));
    }

    await db
      .update(quizzesTable)
      .set({ questionCount: rows.length })
      .where(eq(quizzesTable.id, quiz.id));

    migratedQuestions += rows.length;
    migratedQuizzes += 1;
  }

  // Backfill legacy attempts: they have completed_at set but still carry the
  // default in_progress status from the new schema.
  const legacyAttempts = await db
    .select({
      id: attemptsTable.id,
      quizId: attemptsTable.quizId,
      score: attemptsTable.score,
      totalMarks: attemptsTable.totalMarks,
      submittedAt: attemptsTable.submittedAt,
    })
    .from(attemptsTable)
    .where(and(eq(attemptsTable.status, "in_progress"), isNotNull(attemptsTable.submittedAt)));

  const passScores = new Map((await db.select().from(quizzesTable)).map((q) => [q.id, q.passScore]));
  let migratedAttempts = 0;

  for (const attempt of legacyAttempts) {
    const total = attempt.totalMarks > 0 ? attempt.totalMarks : 0;
    const percentage = total > 0 ? Math.round((attempt.score / total) * 100) : 0;
    const passScore = passScores.get(attempt.quizId) ?? 50;

    await db
      .update(attemptsTable)
      .set({
        status: "submitted",
        totalMarks: total,
        percentage,
        passed: percentage >= passScore,
        startedAt: attempt.submittedAt ?? undefined,
        answers: [],
      })
      .where(eq(attemptsTable.id, attempt.id));

    migratedAttempts += 1;
  }

  console.log(
    [
      `Retired social quizzes unpublished: ${retiredQuizzes}`,
      `Quizzes normalised: ${migratedQuizzes}`,
      `Questions migrated: ${migratedQuestions}`,
      `Attempts backfilled: ${migratedAttempts}`,
    ].join("\n")
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Quiz data migration failed:", error);
    process.exit(1);
  });
