import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/* ────────────────────────────────────────────────────────────────────────────
 * Accounts
 * ──────────────────────────────────────────────────────────────────────────── */

export const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull().default("Learner"),
  email: text("email").notNull().default(""),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  /* Deprecated columns from the credits era. Retained so existing rows keep their data. */
  role: text("role").notNull().default("student"),
  credits: integer("credits").notNull().default(0),
  plan: text("plan").notNull().default("free"),
  wallpaperUrl: text("wallpaper_url"),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;

/* ────────────────────────────────────────────────────────────────────────────
 * Quizzes
 *
 * Content is written directly to these tables by the quiz ingestion workflow —
 * there is no in-app authoring surface. A quiz holds any number of questions
 * (the UI is built for up to 1,000) and its own timing/attempt rules.
 * ──────────────────────────────────────────────────────────────────────────── */

export const quizzesTable = sqliteTable(
  "quizzes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    /** Public URL identifier. Stored as `share_slug` for backwards compatibility. */
    slug: text("share_slug").notNull().unique(),
    description: text("description").notNull().default(""),
    subject: text("subject_name"),
    /** "easy" | "medium" | "hard" */
    difficulty: text("difficulty").notNull().default("medium"),
    /** null = untimed. Otherwise the time limit for a full attempt. */
    durationMinutes: integer("duration_minutes"),
    /** Percentage required to pass (0-100). */
    passScore: integer("pass_score").notNull().default(50),
    /** null = unlimited attempts. */
    maxAttempts: integer("max_attempts"),
    shuffleQuestions: integer("shuffle_questions", { mode: "boolean" }).notNull().default(false),
    /** Restricted quizzes require the access code to start an attempt. */
    accessCode: text("pass_key"),
    /** Cached count; kept in sync by the ingestion workflow. */
    questionCount: integer("question_count").notNull().default(0),
    /** Published quizzes are listed in the catalogue. Stored as `is_public`. */
    isPublished: integer("is_public", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
    /* Deprecated columns retained for existing rows. */
    topic: text("topic"),
    userId: text("user_id"),
    quizType: text("quiz_type"),
    questions: text("questions", { mode: "json" }).notNull().default(sql`'[]'`),
  },
  (t) => [index("quizzes_published_idx").on(t.isPublished, t.difficulty)]
);

export type Quiz = typeof quizzesTable.$inferSelect;
export type InsertQuiz = typeof quizzesTable.$inferInsert;

export const questionsTable = sqliteTable(
  "questions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quizId: integer("quiz_id").notNull(),
    prompt: text("prompt").notNull(),
    options: text("options", { mode: "json" }).notNull().$type<string[]>(),
    correctIndex: integer("correct_index").notNull().default(0),
    explanation: text("explanation"),
    reference: text("reference"),
    imageUrl: text("image_url"),
    marks: integer("marks").notNull().default(1),
    orderIndex: integer("order_index").notNull().default(0),
  },
  (t) => [index("questions_quiz_idx").on(t.quizId, t.orderIndex)]
);

export type Question = typeof questionsTable.$inferSelect;
export type InsertQuestion = typeof questionsTable.$inferInsert;

/* ────────────────────────────────────────────────────────────────────────────
 * Attempts
 * ──────────────────────────────────────────────────────────────────────────── */

export type StoredAnswer = {
  questionId: number;
  selectedIndex: number | null;
  correct: boolean;
  marksAwarded: number;
};

export const attemptsTable = sqliteTable(
  "quiz_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    quizId: integer("quiz_id").notNull(),
    /** "in_progress" | "submitted" | "expired" */
    status: text("status").notNull().default("in_progress"),
    startedAt: text("started_at").notNull().default(sql`(datetime('now'))`),
    expiresAt: text("expires_at"),
    /** Submission time. Stored as `completed_at` for backwards compatibility. */
    submittedAt: text("completed_at"),
    score: integer("score").notNull().default(0),
    totalMarks: integer("total").notNull().default(0),
    percentage: integer("percentage").notNull().default(0),
    passed: integer("passed", { mode: "boolean" }).notNull().default(false),
    timeTakenSeconds: integer("time_taken_seconds"),
    /** Draft answers while the attempt is open, final answers once submitted. */
    answers: text("answers", { mode: "json" }).notNull().default(sql`'[]'`).$type<StoredAnswer[]>(),
  },
  (t) => [
    index("attempts_user_idx").on(t.userId, t.quizId),
    index("attempts_status_idx").on(t.userId, t.status),
  ]
);

export type Attempt = typeof attemptsTable.$inferSelect;
export type InsertAttempt = typeof attemptsTable.$inferInsert;

/* ────────────────────────────────────────────────────────────────────────────
 * Deprecated tables from the old AI/credit product.
 *
 * No longer read or written by the application, but still declared so the
 * schema sync never drops historical data.
 * ──────────────────────────────────────────────────────────────────────────── */

export const flashcardSetsTable = sqliteTable("flashcard_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  cards: text("cards", { mode: "json" }).notNull().$type<Array<{ front: string; back: string }>>(),
  count: integer("count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const flashcardReviewsTable = sqliteTable(
  "flashcard_reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    setId: integer("set_id").notNull(),
    cardIndex: integer("card_index").notNull(),
    easeFactor: real("ease_factor").notNull().default(2.5),
    interval: integer("interval").notNull().default(1),
    repetitions: integer("repetitions").notNull().default(0),
    nextReview: text("next_review"),
    lastReview: text("last_review"),
  },
  (t) => [uniqueIndex("flashcard_reviews_user_set_card").on(t.userId, t.setId, t.cardIndex)]
);

export const creditTransactionsTable = sqliteTable("credit_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull().default(""),
  reference: text("reference"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const chatSessionsTable = sqliteTable("chat_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("New Chat"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const chatMessagesTable = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const summariesTable = sqliteTable("summaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const streaksTable = sqliteTable("streaks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastStudyDate: text("last_study_date"),
  totalStudyDays: integer("total_study_days").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const achievementsTable = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  unlockedAt: text("unlocked_at").notNull().default(sql`(datetime('now'))`),
});
