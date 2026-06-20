import { sqliteTable, text, integer, real, unique } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull().default("Learner"),
  email: text("email").notNull().default(""),
  credits: integer("credits").notNull().default(100),
  plan: text("plan").notNull().default("free"),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const quizzesTable = sqliteTable("quizzes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull().default(""),
  difficulty: text("difficulty").notNull().default("medium"),
  questions: text("questions", { mode: "json" }).notNull().default([]),
  questionCount: integer("question_count").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const quizAttemptsTable = sqliteTable("quiz_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  quizId: integer("quiz_id").notNull(),
  score: integer("score").notNull().default(0),
  total: integer("total").notNull().default(0),
  completedAt: text("completed_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const flashcardSetsTable = sqliteTable("flashcard_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull().default(""),
  cards: text("cards", { mode: "json" }).notNull().default([]),
  count: integer("count").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const flashcardReviewsTable = sqliteTable("flashcard_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  setId: integer("set_id").notNull(),
  cardIndex: integer("card_index").notNull(),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(1),
  repetitions: integer("repetitions").notNull().default(0),
  nextReview: text("next_review"),
  lastReview: text("last_review"),
});

export const achievementsTable = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  unlockedAt: text("unlocked_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (t) => [unique("achievements_user_type").on(t.userId, t.type)]);

export const creditTransactionsTable = sqliteTable("credit_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull().default("usage"),
  description: text("description").notNull().default(""),
  reference: text("reference"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const streaksTable = sqliteTable("streaks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastStudyDate: text("last_study_date"),
  totalStudyDays: integer("total_study_days").notNull().default(0),
  updatedAt: text("updated_at"),
});

export const summariesTable = sqliteTable("summaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  topic: text("topic").notNull().default(""),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const chatSessionsTable = sqliteTable("chat_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("New Chat"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at"),
});

export const chatMessagesTable = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
