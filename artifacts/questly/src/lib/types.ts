import type { ResultMode } from "@/lib/course-config";
import type { AttemptStatus } from "@/lib/attempt-status";

export type { ResultMode };
export type { AttemptStatus };

export type Difficulty = "easy" | "medium" | "hard";

export type CourseSummary = {
  id: number;
  slug: string;
  title: string;
  /** Course code as assigned by the institution, e.g. "GST 112". */
  code: string | null;
  description: string;
  subject: string | null;
  difficulty: Difficulty;
  priceKobo: number;
  currency: string;
  durationMinutes: number | null;
  questionCount: number;
  passScore: number;
  maxAttempts: number | null;
  isFree: boolean;
  isFeatured: boolean;
  coverImageUrl: string | null;
  /** True when the course is free or the signed-in learner owns it. */
  hasAccess: boolean;
  isPurchased: boolean;
  /** Graded attempts only: abandoning an attempt does not consume a try. */
  attemptsUsed: number;
  attemptsRemaining: number | null;
  bestPercentage: number | null;
  lastPercentage: number | null;
  /** Set for courses on the My Courses screen, where the purchase is known. */
  purchasedAt: string | null;
};

/** One chapter of a course's question bank, as printed in the source bank. */
export type CourseChapter = {
  number: number;
  title: string;
  questionCount: number;
};

export type CourseDetail = CourseSummary & {
  totalMarks: number;
  averagePercentage: number | null;
  createdAt: string;
  /** False until Paystack server credentials are configured. */
  paymentConfigured: boolean;
  /** Chapters in printed order; empty when the bank is unchaptered. */
  chapters: CourseChapter[];
};

export type QuestionView = {
  id: number;
  prompt: string;
  options: string[];
  marks: number;
  imageUrl: string | null;
  orderIndex: number;
  /** Printed chapter of the bank; null/0 when the course is unchaptered. */
  chapterNumber: number | null;
  chapterTitle: string | null;
};

/** Server-verified verdict for an answer submitted in Instant Results mode. */
export type AnswerFeedback = {
  questionId: number;
  selectedIndex: number | null;
  correct: boolean;
  correctIndex: number;
  explanation: string | null;
  reference: string | null;
};

export type AttemptState = {
  id: number;
  courseId: number;
  courseSlug: string;
  courseTitle: string;
  subject: string | null;
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string | null;
  secondsRemaining: number | null;
  durationMinutes: number | null;
  /** Chapter this attempt draws from; null = the whole course. */
  chapterNumber: number | null;
  /** How this attempt submits and reveals answers. */
  resultMode: ResultMode;
  passScore: number;
  totalMarks: number;
  questions: QuestionView[];
  answers: Array<{ questionId: number; selectedIndex: number | null }>;
  /** Populated only for Instant Results attempts that have graded answers. */
  feedback: AnswerFeedback[];
  departures: number;
  lastDepartureAt: string | null;
  maxDepartures: number;
  terminationReason: string | null;
};

export type ResultQuestion = QuestionView & {
  correctIndex: number;
  explanation: string | null;
  reference: string | null;
  selectedIndex: number | null;
  correct: boolean;
  marksAwarded: number;
};

export type AttemptResult = {
  id: number;
  courseId: number;
  courseSlug: string;
  courseTitle: string;
  subject: string | null;
  /** Graded statuses plus `not_submitted`; an open attempt returns 409. */
  status: Exclude<AttemptStatus, "in_progress">;
  startedAt: string;
  submittedAt: string | null;
  timeTakenSeconds: number | null;
  /** Timer chosen for this attempt. null = untimed. */
  durationMinutes: number | null;
  /** Chapter this attempt drew from; null = the whole course. */
  chapterNumber: number | null;
  /** How answers were submitted and revealed. */
  resultMode: ResultMode;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  passScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  answeredCount: number;
  totalQuestions: number;
  terminationReason: string | null;
  /** False for attempts with no score (not submitted) or no stored sheet. */
  hasResult: boolean;
  /** False for older attempts that only stored an aggregate score. */
  hasReview: boolean;
  questions: ResultQuestion[];
};

/**
 * One row of attempt history.
 *
 * `hasResult` is the flag every surface should branch on: only graded attempts
 * carry a meaningful score, marks and percentage. An attempt that was never
 * submitted keeps its record (and its saved answers) but reports counts only,
 * never a 0/0 result.
 */
export type HistoryItem = {
  attemptId: number;
  /** 1-based position of this attempt within its course. */
  attemptNumber: number;
  courseId: number;
  courseSlug: string;
  courseTitle: string;
  subject: string | null;
  difficulty: Difficulty;
  status: AttemptStatus;
  hasResult: boolean;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  startedAt: string;
  submittedAt: string | null;
  expiresAt: string | null;
  timeTakenSeconds: number | null;
  terminationReason: string | null;
  /** Chapter practised, when the attempt was scoped to one. */
  chapterNumber: number | null;
};

export type Analytics = {
  /** Attempts that were started, graded or not. */
  totalAttempts: number;
  /** Submitted/expired/terminated attempts — the only ones with a score. */
  completedAttempts: number;
  inProgressAttempts: number;
  notSubmittedAttempts: number;
  averagePercentage: number;
  passRate: number;
  bestPercentage: number;
  totalMinutes: number;
  trend: Array<{ date: string; percentage: number }>;
  bySubject: Array<{ subject: string; attempts: number; averagePercentage: number }>;
};

export type DashboardData = {
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  stats: {
    coursesTaken: number;
    completedAttempts: number;
    averagePercentage: number;
    passRate: number;
    bestPercentage: number;
    purchasedCourses: number;
    inProgressAttempts: number;
    notSubmittedAttempts: number;
  };
  purchasedCourses: CourseSummary[];
  subjectPerformance: Array<{ subject: string; attempts: number; averagePercentage: number }>;
  recentResults: HistoryItem[];
  recommended: CourseSummary[];
};
