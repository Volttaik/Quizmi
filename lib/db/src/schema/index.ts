import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull().default("Learner"),
  email: text("email").notNull().default(""),
  credits: integer("credits").notNull().default(20),
  plan: text("plan").notNull().default("free"),
  avatarUrl: text("avatar_url"),
  wallpaperUrl: text("wallpaper_url"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;

export const quizzesTable = sqliteTable("quizzes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  questions: text("questions", { mode: "json" }).notNull().$type<
    Array<{ question: string; options: string[]; correct: number; explanation?: string; reference?: string }>
  >(),
  questionCount: integer("question_count").notNull().default(0),
  quizType: text("quiz_type").notNull().default("study"),
  subjectName: text("subject_name"),
  description: text("description"),
  shareSlug: text("share_slug").notNull().unique(),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  passKey: text("pass_key"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type Quiz = typeof quizzesTable.$inferSelect;
export type InsertQuiz = typeof quizzesTable.$inferInsert;

export const flashcardSetsTable = sqliteTable("flashcard_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  cards: text("cards", { mode: "json" }).notNull().$type<Array<{ front: string; back: string }>>(),
  count: integer("count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type FlashcardSet = typeof flashcardSetsTable.$inferSelect;
export type InsertFlashcardSet = typeof flashcardSetsTable.$inferInsert;

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

export type FlashcardReview = typeof flashcardReviewsTable.$inferSelect;
export type InsertFlashcardReview = typeof flashcardReviewsTable.$inferInsert;

export const creditTransactionsTable = sqliteTable("credit_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull().default(""),
  reference: text("reference"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type CreditTransaction = typeof creditTransactionsTable.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactionsTable.$inferInsert;

export const chatSessionsTable = sqliteTable("chat_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("New Chat"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export type ChatSession = typeof chatSessionsTable.$inferSelect;
export type InsertChatSession = typeof chatSessionsTable.$inferInsert;

export const chatMessagesTable = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type ChatMessage = typeof chatMessagesTable.$inferSelect;
export type InsertChatMessage = typeof chatMessagesTable.$inferInsert;

export const quizAttemptsTable = sqliteTable("quiz_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  quizId: integer("quiz_id").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  completedAt: text("completed_at").notNull().default(sql`(datetime('now'))`),
});

export type QuizAttempt = typeof quizAttemptsTable.$inferSelect;
export type InsertQuizAttempt = typeof quizAttemptsTable.$inferInsert;

export const summariesTable = sqliteTable("summaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type Summary = typeof summariesTable.$inferSelect;
export type InsertSummary = typeof summariesTable.$inferInsert;

export const streaksTable = sqliteTable("streaks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastStudyDate: text("last_study_date"),
  totalStudyDays: integer("total_study_days").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export type Streak = typeof streaksTable.$inferSelect;
export type InsertStreak = typeof streaksTable.$inferInsert;

export const achievementsTable = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  unlockedAt: text("unlocked_at").notNull().default(sql`(datetime('now'))`),
});

export type Achievement = typeof achievementsTable.$inferSelect;
export type InsertAchievement = typeof achievementsTable.$inferInsert;
