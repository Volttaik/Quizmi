export type Difficulty = "easy" | "medium" | "hard";
export type AttemptStatus = "in_progress" | "submitted" | "expired";

export type QuizSummary = {
  id: number;
  slug: string;
  title: string;
  description: string;
  subject: string | null;
  difficulty: Difficulty;
  durationMinutes: number | null;
  questionCount: number;
  passScore: number;
  maxAttempts: number | null;
  isRestricted: boolean;
  attemptsUsed: number;
  attemptsRemaining: number | null;
  bestPercentage: number | null;
  lastPercentage: number | null;
};

export type QuizDetail = QuizSummary & {
  totalMarks: number;
  averagePercentage: number | null;
  inProgressAttemptId: number | null;
  createdAt: string;
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
  quizId: number;
  quizSlug: string;
  quizTitle: string;
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
  quizId: number;
  quizSlug: string;
  quizTitle: string;
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
  /** False for older attempts that only stored an aggregate score. */
  hasReview: boolean;
  questions: ResultQuestion[];
};

export type HistoryItem = {
  attemptId: number;
  quizId: number;
  quizSlug: string;
  quizTitle: string;
  subject: string | null;
  difficulty: Difficulty;
  status: AttemptStatus;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string | null;
  timeTakenSeconds: number | null;
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
    quizzesTaken: number;
    completedAttempts: number;
    averagePercentage: number;
    passRate: number;
    bestPercentage: number;
  };
  inProgress: Array<{
    attemptId: number;
    quizSlug: string;
    quizTitle: string;
    secondsRemaining: number | null;
    answered: number;
    questionCount: number;
  }>;
  recentResults: HistoryItem[];
  recommended: QuizSummary[];
};
