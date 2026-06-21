import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
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
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const quizzesTable = sqliteTable("quizzes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic"),
  quizType: text("quiz_type"),
  subjectName: text("subject_name"),
  questions: text("questions", { mode: "json" }).$type<any[]>().notNull().default([]),
  questionCount: integer("question_count").notNull().default(0),
  description: text("description"),
  difficulty: text("difficulty"),
  isPrivate: integer("is_private", { mode: "boolean" }).notNull().default(false),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  passKey: text("pass_key"),
  shareSlug: text("share_slug").unique(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const quizAttemptsTable = sqliteTable("quiz_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  quizId: integer("quiz_id").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  completedAt: text("completed_at").default(sql`(datetime('now'))`),
});

export const flashcardSetsTable = sqliteTable("flashcard_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic"),
  cards: text("cards", { mode: "json" }).$type<any[]>().notNull().default([]),
  count: integer("count").notNull().default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
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

export const creditTransactionsTable = sqliteTable("credit_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  reference: text("reference").unique(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const streaksTable = sqliteTable("streaks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastStudyDate: text("last_study_date"),
  totalStudyDays: integer("total_study_days").notNull().default(0),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const achievementsTable = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const summariesTable = sqliteTable("summaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const chatSessionsTable = sqliteTable("chat_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("New Chat"),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const chatMessagesTable = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});
