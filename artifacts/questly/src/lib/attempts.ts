import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  db,
  attemptsTable,
  questionsTable,
  type Attempt,
  type Question,
  type Quiz,
} from "@/lib/db";
import {
  attemptIsExpired,
  deadline,
  scoreAttempt,
  secondsRemaining,
  shuffleDeterministic,
  type AnswerInput,
} from "@/lib/scoring";
import { getQuizBySlug, getQuizById } from "@/lib/quiz";
import type { AttemptState, AttemptResult, ResultQuestion } from "@/lib/types";

/**
 * Question order is derived from the attempt id when shuffling is enabled, so a
 * reload shows the same sequence without persisting a per-attempt order.
 */
export async function loadQuizQuestions(
  quiz: Pick<Quiz, "id" | "shuffleQuestions">,
  seed: number
): Promise<Question[]> {
  const rows = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.quizId, quiz.id))
    .orderBy(asc(questionsTable.orderIndex), asc(questionsTable.id));
  return quiz.shuffleQuestions ? shuffleDeterministic(rows, seed) : rows;
}

export function storedToInput(attempt: Attempt): AnswerInput[] {
  const stored = Array.isArray(attempt.answers) ? attempt.answers : [];
  return stored.map((answer) => ({
    questionId: answer.questionId,
    selectedIndex: answer.selectedIndex,
  }));
}

function timeTakenSeconds(attempt: Attempt, submittedAt: string | null): number | null {
  if (!submittedAt) return null;
  const start = new Date(attempt.startedAt).getTime();
  const end = new Date(submittedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.max(0, Math.round((end - start) / 1000));
}

export async function buildAttemptState(attempt: Attempt, quiz: Quiz): Promise<AttemptState> {
  const questions = await loadQuizQuestions(quiz, attempt.id);
  const stored = storedToInput(attempt);
  const answered = new Map(stored.map((answer) => [answer.questionId, answer.selectedIndex]));

  return {
    id: attempt.id,
    quizId: quiz.id,
    quizSlug: quiz.slug,
    quizTitle: quiz.title,
    subject: quiz.subject,
    status: attempt.status as AttemptState["status"],
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    secondsRemaining: secondsRemaining(attempt.expiresAt),
    durationMinutes: quiz.durationMinutes ?? null,
    passScore: quiz.passScore,
    totalMarks: questions.reduce((total, question) => total + (question.marks || 1), 0),
    questions: questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: Array.isArray(question.options) ? question.options : [],
      marks: question.marks || 1,
      imageUrl: question.imageUrl,
      orderIndex: question.orderIndex,
    })),
    answers: stored.map((answer) => ({
      questionId: answer.questionId,
      selectedIndex: answered.get(answer.questionId) ?? null,
    })),
  };
}

function buildResult(
  attemptId: number,
  quiz: Quiz,
  questions: Question[],
  scored: ReturnType<typeof scoreAttempt>,
  status: AttemptResult["status"],
  startedAt: string,
  submittedAt: string,
  timeTaken: number | null,
  hasReview = true
): AttemptResult {
  const answerMap = new Map(scored.answers.map((answer) => [answer.questionId, answer]));

  const reviewQuestions: ResultQuestion[] = questions.map((question) => {
    const answer = answerMap.get(question.id);
    return {
      id: question.id,
      prompt: question.prompt,
      options: Array.isArray(question.options) ? question.options : [],
      marks: question.marks || 1,
      imageUrl: question.imageUrl,
      orderIndex: question.orderIndex,
      correctIndex: question.correctIndex,
      explanation: question.explanation ?? null,
      reference: question.reference ?? null,
      selectedIndex: answer?.selectedIndex ?? null,
      correct: Boolean(answer?.correct),
      marksAwarded: answer?.marksAwarded ?? 0,
    };
  });

  return {
    id: attemptId,
    quizId: quiz.id,
    quizSlug: quiz.slug,
    quizTitle: quiz.title,
    subject: quiz.subject,
    status,
    startedAt,
    submittedAt,
    timeTakenSeconds: timeTaken,
    score: scored.score,
    totalMarks: scored.totalMarks,
    percentage: scored.percentage,
    passed: scored.passed,
    passScore: quiz.passScore,
    correctCount: scored.correctCount,
    totalQuestions: scored.totalQuestions,
    hasReview,
    questions: reviewQuestions,
  };
}

/**
 * Scores and closes an attempt. Already-finished attempts are returned
 * unchanged, which makes both the timer and the manual submit path idempotent.
 */
export async function finalizeAttempt(
  attempt: Attempt,
  quiz: Quiz,
  submitted?: AnswerInput[]
): Promise<AttemptResult> {
  const questions = await loadQuizQuestions(quiz, attempt.id);
  const answers = submitted ?? storedToInput(attempt);
  const scored = scoreAttempt(
    questions.map((question) => ({
      id: question.id,
      correctIndex: question.correctIndex,
      marks: question.marks,
    })),
    answers,
    quiz.passScore
  );

  if (attempt.status !== "in_progress") {
    return buildResultFromStored(attempt, quiz);
  }

  const expired = attemptIsExpired(attempt.expiresAt);
  const status: AttemptResult["status"] = expired ? "expired" : "submitted";
  const now = new Date().toISOString();
  const submittedAt = expired && attempt.expiresAt ? attempt.expiresAt : now;

  await db
    .update(attemptsTable)
    .set({
      status,
      submittedAt,
      score: scored.score,
      totalMarks: scored.totalMarks,
      percentage: scored.percentage,
      passed: scored.passed,
      answers: scored.answers,
      timeTakenSeconds: timeTakenSeconds(attempt, submittedAt),
    })
    .where(eq(attemptsTable.id, attempt.id));

  return buildResult(
    attempt.id,
    quiz,
    questions,
    scored,
    status,
    attempt.startedAt,
    submittedAt,
    timeTakenSeconds(attempt, submittedAt)
  );
}

/**
 * Rebuilds a finished attempt for the results page without writing to the DB.
 * Attempts imported from the legacy product only have an aggregate score, so
 * their stored result is shown as-is instead of being re-scored to zero.
 */
export async function buildResultFromStored(attempt: Attempt, quiz: Quiz): Promise<AttemptResult> {
  const storedAnswers = Array.isArray(attempt.answers) ? attempt.answers : [];
  if (storedAnswers.length === 0) {
    const guidanceScore =
      attempt.totalMarks > 0
        ? Math.round((attempt.score / attempt.totalMarks) * 100)
        : attempt.percentage;
    return {
      id: attempt.id,
      quizId: quiz.id,
      quizSlug: quiz.slug,
      quizTitle: quiz.title,
      subject: quiz.subject,
      status: attempt.status === "expired" ? "expired" : "submitted",
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt ?? attempt.startedAt,
      timeTakenSeconds: attempt.timeTakenSeconds ?? timeTakenSeconds(attempt, attempt.submittedAt),
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage || guidanceScore,
      passed: Boolean(attempt.passed),
      passScore: quiz.passScore,
      correctCount: 0,
      totalQuestions: 0,
      hasReview: false,
      questions: [],
    };
  }

  const questions = await loadQuizQuestions(quiz, attempt.id);
  const scored = scoreAttempt(
    questions.map((question) => ({
      id: question.id,
      correctIndex: question.correctIndex,
      marks: question.marks,
    })),
    storedToInput(attempt),
    quiz.passScore
  );
  const status: AttemptResult["status"] = attempt.status === "expired" ? "expired" : "submitted";

  return buildResult(
    attempt.id,
    quiz,
    questions,
    scored,
    status,
    attempt.startedAt,
    attempt.submittedAt ?? attempt.startedAt,
    attempt.timeTakenSeconds ?? timeTakenSeconds(attempt, attempt.submittedAt)
  );
}

export async function getAttemptById(id: number) {
  return db.query.attemptsTable.findFirst({ where: eq(attemptsTable.id, id) });
}

export async function getAttemptForUser(id: number, clerkId: string) {
  const attempt = await getAttemptById(id);
  if (!attempt || attempt.userId !== clerkId) return null;
  return attempt;
}

export type StartAttemptResult =
  | { ok: true; state: AttemptState }
  | { ok: false; status: number; error: string };

/**
 * Starts (or resumes) an attempt. All launch rules live here so the route and
 * the verification script exercise exactly the same code path:
 * access code, question availability, resume, attempt limits, timer.
 */
export async function startAttemptForUser(
  clerkId: string,
  slug: string,
  accessCode?: string
): Promise<StartAttemptResult> {
  const quiz = await getQuizBySlug(slug);
  if (!quiz || !quiz.isPublished) return { ok: false, status: 404, error: "Quiz not found" };

  if (quiz.accessCode) {
    const provided = (accessCode ?? "").trim();
    if (!provided || provided.toUpperCase() !== quiz.accessCode.toUpperCase()) {
      return { ok: false, status: 403, error: "That access code is not valid for this quiz" };
    }
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questionsTable)
    .where(eq(questionsTable.quizId, quiz.id));
  if (Number(count) === 0) {
    return { ok: false, status: 409, error: "This quiz has no questions yet" };
  }

  const open = await db.query.attemptsTable.findFirst({
    where: and(
      eq(attemptsTable.userId, clerkId),
      eq(attemptsTable.quizId, quiz.id),
      eq(attemptsTable.status, "in_progress")
    ),
    orderBy: desc(attemptsTable.id),
  });

  if (open) {
    if (!attemptIsExpired(open.expiresAt)) {
      return { ok: true, state: await buildAttemptState(open, quiz) };
    }
    await finalizeAttempt(open, quiz);
  }

  const [{ used }] = await db
    .select({ used: sql<number>`count(*)` })
    .from(attemptsTable)
    .where(and(eq(attemptsTable.userId, clerkId), eq(attemptsTable.quizId, quiz.id)));

  const maxAttempts = quiz.maxAttempts && quiz.maxAttempts > 0 ? quiz.maxAttempts : null;
  if (maxAttempts !== null && Number(used) >= maxAttempts) {
    return {
      ok: false,
      status: 403,
      error: `You have used all ${maxAttempts} attempt${maxAttempts === 1 ? "" : "s"} for this quiz`,
    };
  }

  const startedAt = new Date();
  const [attempt] = await db
    .insert(attemptsTable)
    .values({
      userId: clerkId,
      quizId: quiz.id,
      status: "in_progress",
      startedAt: startedAt.toISOString(),
      expiresAt: deadline(quiz.durationMinutes ?? null, startedAt),
      answers: [],
    })
    .returning();

  return { ok: true, state: await buildAttemptState(attempt, quiz) };
}

/** Loads an attempt for its owner and closes it first if the clock ran out. */
export async function loadAttemptState(
  attemptId: number,
  clerkId: string
): Promise<{ state: AttemptState } | { error: string; status: number }> {
  let attempt = await getAttemptForUser(attemptId, clerkId);
  if (!attempt) return { error: "Attempt not found", status: 404 };

  const quiz = await getQuizById(attempt.quizId);
  if (!quiz) return { error: "Quiz not found", status: 404 };

  if (attempt.status === "in_progress" && attemptIsExpired(attempt.expiresAt)) {
    await finalizeAttempt(attempt, quiz);
    attempt = (await getAttemptById(attemptId)) ?? attempt;
  }

  return { state: await buildAttemptState(attempt, quiz) };
}
