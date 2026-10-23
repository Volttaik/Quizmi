import type { ResultMode } from "@/lib/course-config";

export type { ResultMode };

export type Difficulty = "easy" | "medium" | "hard";
export type AttemptStatus = "in_progress" | "submitted" | "expired" | "terminated";

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
  totalQuestions: number;
  terminationReason: string | null;
  /** False for older attempts that only stored an aggregate score. */
  hasReview: boolean;
  questions: ResultQuestion[];
};

export type HistoryItem = {
  attemptId: number;
  courseId: number;
  courseSlug: string;
  courseTitle: string;
  subject: string | null;
  difficulty: Difficulty;
  status: AttemptStatus;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string | null;
  timeTakenSeconds: number | null;
  terminationReason: string | null;
};

export type Analytics = {
  totalAttempts: number;
  completedAttempts: number;
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
  };
  purchasedCourses: CourseSummary[];
  subjectPerformance: Array<{ subject: string; attempts: number; averagePercentage: number }>;
  recentResults: HistoryItem[];
  recommended: CourseSummary[];
};
