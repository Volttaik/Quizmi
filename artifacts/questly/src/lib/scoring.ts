import type { Question, StoredAnswer } from "@/lib/db";

export type AnswerInput = { questionId: number; selectedIndex: number | null };

export type ScoreResult = {
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  answers: StoredAnswer[];
};

type ScorableQuestion = Pick<Question, "id" | "correctIndex" | "marks">;

/**
 * Scores a submitted attempt on the server. Answers are matched by question id,
 * duplicate submissions keep the last answer, unknown ids are ignored and
 * unanswered questions score zero.
 */
export function scoreAttempt(
  questions: ScorableQuestion[],
  submitted: AnswerInput[],
  passScore: number
): ScoreResult {
  const latest = new Map<number, number | null>();
  for (const answer of submitted) {
    if (!answer || typeof answer.questionId !== "number") continue;
    const selected =
      typeof answer.selectedIndex === "number" && Number.isInteger(answer.selectedIndex)
        ? answer.selectedIndex
        : null;
    latest.set(answer.questionId, selected);
  }

  const answers: StoredAnswer[] = [];
  let score = 0;
  let totalMarks = 0;
  let correctCount = 0;

  for (const question of questions) {
    const marks = Number.isFinite(question.marks) && question.marks > 0 ? question.marks : 1;
    totalMarks += marks;

    const selectedIndex = latest.get(question.id) ?? null;
    const correct = selectedIndex !== null && selectedIndex === question.correctIndex;
    const marksAwarded = correct ? marks : 0;

    if (correct) {
      score += marks;
      correctCount += 1;
    }

    answers.push({ questionId: question.id, selectedIndex, correct, marksAwarded });
  }

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  return {
    score,
    totalMarks,
    percentage,
    correctCount,
    totalQuestions: questions.length,
    passed: percentage >= passScore,
    answers,
  };
}

/** Keeps only well-formed answers so a malformed client cannot corrupt an attempt. */
export function sanitizeAnswerInput(input: unknown): AnswerInput[] {
  if (!Array.isArray(input)) return [];
  const answers: AnswerInput[] = [];
  const seen = new Set<number>();

  for (const entry of input.slice(0, 2000) as Array<{ questionId?: unknown; selectedIndex?: unknown }>) {
    const questionId = Number(entry?.questionId);
    if (!Number.isInteger(questionId) || questionId <= 0 || seen.has(questionId)) continue;
    const rawSelected = entry?.selectedIndex;
    const selectedIndex =
      typeof rawSelected === "number" && Number.isInteger(rawSelected) && rawSelected >= 0
        ? rawSelected
        : null;
    seen.add(questionId);
    answers.push({ questionId, selectedIndex });
  }

  return answers;
}

/** Deadline for a timed attempt, as an ISO string. Untimed assessments return null. */
export function deadline(durationMinutes: number | null, from: Date = new Date()): string | null {
  if (!durationMinutes || durationMinutes <= 0) return null;
  return new Date(from.getTime() + durationMinutes * 60_000).toISOString();
}

/** Seconds left, clamped at zero. Untimed attempts report null. */
export function secondsRemaining(expiresAt: string | null, now: Date = new Date()): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 1000));
}

export function attemptIsExpired(expiresAt: string | null, now: Date = new Date()): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}

/** Number of attempts a student may still start. `null` means unlimited. */
export function attemptsRemaining(maxAttempts: number | null, used: number): number | null {
  if (maxAttempts === null || maxAttempts <= 0) return null;
  return Math.max(0, maxAttempts - used);
}

/** Deterministic shuffle so an attempt keeps a stable question order. */
export function shuffleDeterministic<T>(items: T[], seed: number): T[] {
  const output = [...items];
  let state = seed || 1;
  for (let i = output.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const j = state % (i + 1);
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}
