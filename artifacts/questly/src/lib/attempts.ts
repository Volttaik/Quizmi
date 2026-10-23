import { and, asc, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import {
  db,
  attemptsTable,
  questionsTable,
  type Attempt,
  type Course,
  type Question,
  type StoredAnswer,
  type ViolationEntry,
} from "@/lib/db";
import {
  DEPARTURE_DEDUPE_MS,
  MAX_DEPARTURES,
  MAX_QUESTIONS_PER_ATTEMPT,
  isSupportedDuration,
} from "@/lib/course-config";
import {
  attemptIsExpired,
  deadline,
  sanitizeAnswerInput,
  scoreAttempt,
  secondsRemaining,
  type AnswerInput,
} from "@/lib/scoring";
import { courseHasAccess, getCourseById, getCourseBySlug, isCoursePurchased } from "@/lib/courses";
import type { AttemptResult, AttemptState, ResultQuestion } from "@/lib/types";

const QUESTION_FETCH_CHUNK = 400;

/* ── Question sets ────────────────────────────────────────────────────────── */

async function randomQuestionIds(courseId: number, count: number): Promise<number[]> {
  const rows = await db
    .select({ id: questionsTable.id })
    .from(questionsTable)
    .where(eq(questionsTable.courseId, courseId))
    .orderBy(sql`random()`)
    .limit(count);
  return rows.map((row) => row.id);
}

async function questionsByIds(courseId: number, ids: number[]): Promise<Question[]> {
  if (ids.length === 0) return [];
  const found = new Map<number, Question>();

  for (let offset = 0; offset < ids.length; offset += QUESTION_FETCH_CHUNK) {
    const chunk = ids.slice(offset, offset + QUESTION_FETCH_CHUNK);
    const rows = await db
      .select()
      .from(questionsTable)
      .where(and(eq(questionsTable.courseId, courseId), inArray(questionsTable.id, chunk)));
    for (const row of rows) found.set(row.id, row);
  }

  return ids.map((id) => found.get(id)).filter((row): row is Question => Boolean(row));
}

/**
 * Questions are loaded by the stable id list stored on the attempt, so a
 * refresh shows the same set in the same order and only the chosen subset is
 * fetched for large courses.
 */
export async function loadAttemptQuestions(attempt: Attempt): Promise<Question[]> {
  const ids = Array.isArray(attempt.questionIds) ? attempt.questionIds : [];
  if (ids.length > 0) {
    return questionsByIds(attempt.courseId, ids);
  }

  // Attempts created before per-attempt selection stored no ids.
  return db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.courseId, attempt.courseId))
    .orderBy(asc(questionsTable.orderIndex), asc(questionsTable.id));
}

function inputFor(attempt: Attempt): AnswerInput[] {
  const stored = Array.isArray(attempt.answers) ? attempt.answers : [];
  return stored.map((answer) => ({
    questionId: answer.questionId,
    selectedIndex: answer.selectedIndex,
  }));
}

function answersForAttempt(attempt: Attempt, input: AnswerInput[]): AnswerInput[] {
  const allowed = new Set(
    Array.isArray(attempt.questionIds) ? attempt.questionIds : []
  );
  if (allowed.size === 0) return input;
  return input.filter((answer) => allowed.has(answer.questionId));
}

/* ── Read models ──────────────────────────────────────────────────────────── */

function timeTakenSeconds(startedAt: string, submittedAt: string | null): number | null {
  if (!submittedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(submittedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.max(0, Math.round((end - start) / 1000));
}

export async function buildAttemptState(
  attempt: Attempt,
  course: Course
): Promise<AttemptState> {
  const questions = await loadAttemptQuestions(attempt);
  const stored = Array.isArray(attempt.answers) ? attempt.answers : [];

  return {
    id: attempt.id,
    courseId: course.id,
    courseSlug: course.slug,
    courseTitle: course.title,
    subject: course.subject,
    status: attempt.status as AttemptState["status"],
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    secondsRemaining:
      attempt.status === "in_progress" ? secondsRemaining(attempt.expiresAt) : 0,
    durationMinutes: attempt.durationMinutes ?? null,
    passScore: course.passScore,
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
      selectedIndex: answer.selectedIndex,
    })),
    departures: attempt.departures ?? 0,
    lastDepartureAt: attempt.lastDepartureAt,
    maxDepartures: MAX_DEPARTURES,
    terminationReason: attempt.terminationReason,
  };
}

function resultStatus(attempt: Attempt): AttemptResult["status"] {
  if (attempt.status === "expired") return "expired";
  if (attempt.status === "terminated") return "terminated";
  return "submitted";
}

function buildResult(
  attempt: Attempt,
  course: Course,
  questions: Question[],
  scored: ReturnType<typeof scoreAttempt>,
  status: AttemptResult["status"],
  submittedAt: string
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
    id: attempt.id,
    courseId: course.id,
    courseSlug: course.slug,
    courseTitle: course.title,
    subject: course.subject,
    status,
    startedAt: attempt.startedAt,
    submittedAt,
    timeTakenSeconds: timeTakenSeconds(attempt.startedAt, submittedAt),
    score: scored.score,
    totalMarks: scored.totalMarks,
    percentage: scored.percentage,
    passed: scored.passed,
    passScore: course.passScore,
    correctCount: scored.correctCount,
    totalQuestions: scored.totalQuestions,
    terminationReason: attempt.terminationReason,
    hasReview: true,
    questions: reviewQuestions,
  };
}

/* ── Attempt lifecycle ────────────────────────────────────────────────────── */

export async function getAttemptById(id: number) {
  return db.query.attemptsTable.findFirst({ where: eq(attemptsTable.id, id) });
}

export async function getAttemptForUser(id: number, userId: number) {
  const attempt = await getAttemptById(id);
  if (!attempt || attempt.userId !== userId) return null;
  return attempt;
}

export type StartAttemptResult =
  | { ok: true; state: AttemptState }
  | { ok: false; status: number; error: string };

export type StartOptions = {
  questionCount?: number;
  durationMinutes?: number | null;
};

/**
 * Starts or resumes an attempt. All launch rules live here so the route, the
 * exam runner and the result page exercise the same code path:
 * publication, entitlement, question availability, resume, attempt limits,
 * selected timer and per-attempt question selection.
 */
export async function startAttemptForUser(
  user: { id: number },
  slug: string,
  options: StartOptions = {}
): Promise<StartAttemptResult> {
  const course = await getCourseBySlug(slug);
  if (!course || !course.isPublished) return { ok: false, status: 404, error: "Course not found" };

  if (course.priceKobo > 0) {
    const purchased = await isCoursePurchased(user.id, course.id);
    if (!courseHasAccess(course, purchased)) {
      return { ok: false, status: 403, error: "Purchase this course before starting an assessment" };
    }
  }

  const open = await db.query.attemptsTable.findFirst({
    where: and(
      eq(attemptsTable.userId, user.id),
      eq(attemptsTable.courseId, course.id),
      eq(attemptsTable.status, "in_progress")
    ),
    orderBy: desc(attemptsTable.id),
  });

  if (open) {
    if (!attemptIsExpired(open.expiresAt)) {
      return { ok: true, state: await buildAttemptState(open, course) };
    }
    await finalizeAttempt(open, course);
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questionsTable)
    .where(eq(questionsTable.courseId, course.id));
  const available = Number(count);

  if (available === 0) {
    return { ok: false, status: 409, error: "This course has no questions yet" };
  }

  const requested = options.questionCount ?? Math.min(20, available);
  if (!Number.isInteger(requested) || requested < 1) {
    return { ok: false, status: 400, error: "Choose how many questions you want to attempt" };
  }
  if (requested > MAX_QUESTIONS_PER_ATTEMPT) {
    return {
      ok: false,
      status: 400,
      error: `An attempt can include at most ${MAX_QUESTIONS_PER_ATTEMPT} questions`,
    };
  }
  if (requested > available) {
    return {
      ok: false,
      status: 400,
      error: `This course has ${available} questions. Choose ${available} or fewer.`,
    };
  }

  let durationMinutes: number | null;
  if (options.durationMinutes === undefined) {
    durationMinutes = isSupportedDuration(course.durationMinutes)
      ? (course.durationMinutes ?? null)
      : null;
  } else if (isSupportedDuration(options.durationMinutes)) {
    durationMinutes = options.durationMinutes;
  } else {
    return {
      ok: false,
      status: 400,
      error: "Choose a supported timer option (10 to 60 minutes, or unlimited)",
    };
  }

  const [{ used }] = await db
    .select({ used: sql<number>`count(*)` })
    .from(attemptsTable)
    .where(and(eq(attemptsTable.userId, user.id), eq(attemptsTable.courseId, course.id)));

  const maxAttempts = course.maxAttempts && course.maxAttempts > 0 ? course.maxAttempts : null;
  if (maxAttempts !== null && Number(used) >= maxAttempts) {
    return {
      ok: false,
      status: 403,
      error: `You have used all ${maxAttempts} attempt${maxAttempts === 1 ? "" : "s"} for this course`,
    };
  }

  const questionIds = await randomQuestionIds(course.id, requested);
  const startedAt = new Date();
  const now = startedAt.toISOString();

  let attempt: Attempt;
  try {
    [attempt] = await db
      .insert(attemptsTable)
      .values({
        userId: user.id,
        courseId: course.id,
        status: "in_progress",
        startedAt: now,
        lastSeenAt: now,
        expiresAt: deadline(durationMinutes, startedAt),
        durationMinutes,
        questionIds,
        answers: [],
      })
      .returning();
  } catch (error) {
    // The partial unique index allows one open attempt per course. If another
    // request won the race, resume that attempt instead of failing.
    const existing = await db.query.attemptsTable.findFirst({
      where: and(
        eq(attemptsTable.userId, user.id),
        eq(attemptsTable.courseId, course.id),
        eq(attemptsTable.status, "in_progress")
      ),
      orderBy: desc(attemptsTable.id),
    });
    if (!existing) throw error;
    return { ok: true, state: await buildAttemptState(existing, course) };
  }

  return { ok: true, state: await buildAttemptState(attempt, course) };
}

/** Loads an attempt for its owner and closes it first if the clock ran out. */
export async function loadAttemptState(
  attemptId: number,
  userId: number
): Promise<{ state: AttemptState } | { error: string; status: number }> {
  let attempt = await getAttemptForUser(attemptId, userId);
  if (!attempt) return { error: "Attempt not found", status: 404 };

  const course = await getCourseById(attempt.courseId);
  if (!course) return { error: "Course not found", status: 404 };

  if (attempt.status === "in_progress" && attemptIsExpired(attempt.expiresAt)) {
    await finalizeAttempt(attempt, course);
    attempt = (await getAttemptById(attemptId)) ?? attempt;
  }

  return { state: await buildAttemptState(attempt, course) };
}

/**
 * Persists only the answers that changed. The server merges into the stored
 * draft so the runner does not resend a 1,000-answer payload on every click.
 */
export async function saveDraftAnswers(
  attemptId: number,
  userId: number,
  input: unknown
): Promise<
  | { ok: true; saved: boolean; status: string; secondsRemaining: number | null }
  | { ok: false; status: number; error: string }
> {
  const attempt = await getAttemptForUser(attemptId, userId);
  if (!attempt) return { ok: false, status: 404, error: "Attempt not found" };

  if (attempt.status !== "in_progress") {
    return { ok: true, saved: false, status: attempt.status, secondsRemaining: 0 };
  }

  const course = await getCourseById(attempt.courseId);
  if (!course) return { ok: false, status: 404, error: "Course not found" };

  if (attemptIsExpired(attempt.expiresAt)) {
    await finalizeAttempt(attempt, course);
    return { ok: true, saved: false, status: "expired", secondsRemaining: 0 };
  }

  const updates = answersForAttempt(attempt, sanitizeAnswerInput(input));
  const merged = new Map<number, number | null>();
  for (const answer of Array.isArray(attempt.answers) ? attempt.answers : []) {
    if (answer.selectedIndex !== null) merged.set(answer.questionId, answer.selectedIndex);
  }
  for (const answer of updates) {
    if (answer.selectedIndex === null) merged.delete(answer.questionId);
    else merged.set(answer.questionId, answer.selectedIndex);
  }

  const answers: StoredAnswer[] = Array.from(merged.entries()).map(
    ([questionId, selectedIndex]) => ({
      questionId,
      selectedIndex,
      correct: false,
      marksAwarded: 0,
    })
  );

  await db
    .update(attemptsTable)
    .set({ answers, lastSeenAt: new Date().toISOString() })
    .where(and(eq(attemptsTable.id, attempt.id), eq(attemptsTable.status, "in_progress")));

  return {
    ok: true,
    saved: true,
    status: "in_progress",
    secondsRemaining: secondsRemaining(attempt.expiresAt),
  };
}

/**
 * Scores and closes an attempt. Already-finished attempts are returned
 * unchanged, which makes both the timer and the manual submit path idempotent.
 */
export async function finalizeAttempt(
  attempt: Attempt,
  course: Course,
  submitted?: AnswerInput[]
): Promise<AttemptResult> {
  if (attempt.status !== "in_progress") {
    return buildResultFromStored(attempt, course);
  }

  const questions = await loadAttemptQuestions(attempt);
  const answers = answersForAttempt(attempt, submitted ?? inputFor(attempt));
  const scored = scoreAttempt(
    questions.map((question) => ({
      id: question.id,
      correctIndex: question.correctIndex,
      marks: question.marks,
    })),
    answers,
    course.passScore
  );

  const expired = attemptIsExpired(attempt.expiresAt);
  const status: AttemptResult["status"] = expired ? "expired" : "submitted";
  const submittedAt = expired && attempt.expiresAt ? attempt.expiresAt : new Date().toISOString();

  const [finished] = await db
    .update(attemptsTable)
    .set({
      status,
      submittedAt,
      score: scored.score,
      totalMarks: scored.totalMarks,
      percentage: scored.percentage,
      passed: scored.passed,
      answers: scored.answers,
      timeTakenSeconds: timeTakenSeconds(attempt.startedAt, submittedAt),
    })
    .where(and(eq(attemptsTable.id, attempt.id), eq(attemptsTable.status, "in_progress")))
    .returning();

  if (!finished) {
    // Another request closed this attempt first; return its stored result.
    return buildResultFromStored((await getAttemptById(attempt.id)) ?? attempt, course);
  }

  return buildResult(finished, course, questions, scored, status, submittedAt);
}

/** Ends an attempt under the departure policy, scoring the last saved draft. */
export async function terminateAttempt(
  attempt: Attempt,
  course: Course,
  reason: string
): Promise<AttemptResult> {
  if (attempt.status !== "in_progress") return buildResultFromStored(attempt, course);

  const questions = await loadAttemptQuestions(attempt);
  const scored = scoreAttempt(
    questions.map((question) => ({
      id: question.id,
      correctIndex: question.correctIndex,
      marks: question.marks,
    })),
    answersForAttempt(attempt, inputFor(attempt)),
    course.passScore
  );
  const submittedAt = new Date().toISOString();

  const [finished] = await db
    .update(attemptsTable)
    .set({
      status: "terminated",
      terminationReason: reason,
      submittedAt,
      score: scored.score,
      totalMarks: scored.totalMarks,
      percentage: scored.percentage,
      passed: scored.passed,
      answers: scored.answers,
      timeTakenSeconds: timeTakenSeconds(attempt.startedAt, submittedAt),
    })
    .where(and(eq(attemptsTable.id, attempt.id), eq(attemptsTable.status, "in_progress")))
    .returning();

  if (!finished) {
    return buildResultFromStored((await getAttemptById(attempt.id)) ?? attempt, course);
  }

  return buildResult(finished, course, questions, scored, "terminated", submittedAt);
}

export type DepartureResult = {
  status: string;
  departures: number;
  maxDepartures: number;
  remaining: number;
  terminated: boolean;
};

/**
 * Records one confirmed departure. The conditional update makes this
 * idempotent for the two browser events that fire for a single navigation and
 * safe under concurrent requests; the third departure terminates the attempt
 * on the server. Browser detection can never be perfect, but the persisted
 * count is the authority for whether an attempt may resume.
 */
export async function recordDeparture(
  attemptId: number,
  userId: number,
  reason: string
): Promise<DepartureResult | null> {
  let attempt = await getAttemptForUser(attemptId, userId);
  if (!attempt) return null;

  const course = await getCourseById(attempt.courseId);
  if (!course) return null;

  if (attempt.status === "in_progress" && attemptIsExpired(attempt.expiresAt)) {
    await finalizeAttempt(attempt, course);
    attempt = (await getAttemptById(attempt.id)) ?? attempt;
  }

  if (attempt.status !== "in_progress") {
    return {
      status: attempt.status,
      departures: attempt.departures,
      maxDepartures: MAX_DEPARTURES,
      remaining: Math.max(0, MAX_DEPARTURES - attempt.departures),
      terminated: attempt.status === "terminated",
    };
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - DEPARTURE_DEDUPE_MS).toISOString();
  const log: ViolationEntry[] = Array.isArray(attempt.violationLog) ? attempt.violationLog : [];
  const entry: ViolationEntry = {
    at: now.toISOString(),
    reason: reason.slice(0, 120) || "navigated away",
  };
  const nextLog = [...log, entry].slice(-20);

  const [updated] = await db
    .update(attemptsTable)
    .set({
      departures: sql`${attemptsTable.departures} + 1`,
      lastDepartureAt: entry.at,
      lastSeenAt: entry.at,
      violationLog: nextLog,
    })
    .where(
      and(
        eq(attemptsTable.id, attempt.id),
        eq(attemptsTable.status, "in_progress"),
        or(
          isNull(attemptsTable.lastDepartureAt),
          lt(attemptsTable.lastDepartureAt, cutoff)
        )
      )
    )
    .returning();

  if (!updated) {
    const current = (await getAttemptById(attempt.id)) ?? attempt;
    return {
      status: current.status,
      departures: current.departures,
      maxDepartures: MAX_DEPARTURES,
      remaining: Math.max(0, MAX_DEPARTURES - current.departures),
      terminated: current.status === "terminated",
    };
  }

  if (updated.departures >= MAX_DEPARTURES) {
    await terminateAttempt(updated, course, "departures");
    return {
      status: "terminated",
      departures: updated.departures,
      maxDepartures: MAX_DEPARTURES,
      remaining: 0,
      terminated: true,
    };
  }

  return {
    status: "in_progress",
    departures: updated.departures,
    maxDepartures: MAX_DEPARTURES,
    remaining: MAX_DEPARTURES - updated.departures,
    terminated: false,
  };
}

/** Lightweight activity ping; used for diagnostics, not for scoring time. */
export async function recordHeartbeat(attemptId: number, userId: number): Promise<boolean> {
  const [updated] = await db
    .update(attemptsTable)
    .set({ lastSeenAt: new Date().toISOString() })
    .where(
      and(
        eq(attemptsTable.id, attemptId),
        eq(attemptsTable.userId, userId),
        eq(attemptsTable.status, "in_progress")
      )
    )
    .returning({ id: attemptsTable.id });
  return Boolean(updated);
}

/**
 * Rebuilds a finished attempt for the results page without writing to the DB.
 */
export async function buildResultFromStored(
  attempt: Attempt,
  course: Course
): Promise<AttemptResult> {
  const storedAnswers = Array.isArray(attempt.answers) ? attempt.answers : [];
  const status = resultStatus(attempt);

  if (storedAnswers.length === 0) {
    return {
      id: attempt.id,
      courseId: course.id,
      courseSlug: course.slug,
      courseTitle: course.title,
      subject: course.subject,
      status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt ?? attempt.startedAt,
      timeTakenSeconds:
        attempt.timeTakenSeconds ?? timeTakenSeconds(attempt.startedAt, attempt.submittedAt),
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
      passed: Boolean(attempt.passed),
      passScore: course.passScore,
      correctCount: 0,
      totalQuestions: 0,
      terminationReason: attempt.terminationReason,
      hasReview: false,
      questions: [],
    };
  }

  const questions = await loadAttemptQuestions(attempt);

  // Closed attempts already store the scored answer set. Reuse it so editing a
  // question or answer key later cannot rewrite a historical result.
  const scored = {
    score: attempt.score,
    totalMarks: attempt.totalMarks,
    percentage: attempt.percentage,
    correctCount: storedAnswers.filter((answer) => answer.correct).length,
    totalQuestions: questions.length,
    passed: Boolean(attempt.passed),
    answers: storedAnswers,
  };

  return buildResult(
    attempt,
    course,
    questions,
    scored,
    status,
    attempt.submittedAt ?? attempt.startedAt
  );
}
