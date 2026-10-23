export type Difficulty = "easy" | "medium" | "hard";
export type AttemptStatus = "in_progress" | "submitted" | "expired" | "terminated";

export type CourseSummary = {
  id: number;
  slug: string;
  title: string;
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
  inProgressAttemptId: number | null;
};

export type CourseDetail = CourseSummary & {
  totalMarks: number;
  averagePercentage: number | null;
  createdAt: string;
  /** False until Paystack server credentials are configured. */
  paymentConfigured: boolean;
};

export type QuestionView = {
  id: number;
  prompt: string;
  options: string[];
  marks: number;
  imageUrl: string | null;
  orderIndex: number;
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
  passScore: number;
  totalMarks: number;
  questions: QuestionView[];
  answers: Array<{ questionId: number; selectedIndex: number | null }>;
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
  inProgress: Array<{
    attemptId: number;
    courseSlug: string;
    courseTitle: string;
    secondsRemaining: number | null;
    answered: number;
    questionCount: number;
  }>;
  recentResults: HistoryItem[];
  recommended: CourseSummary[];
};
