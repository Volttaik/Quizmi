import { pgTable, text, serial, integer, timestamp, boolean, jsonb, real } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull().default("Learner"),
  email: text("email").notNull().default(""),
  credits: integer("credits").notNull().default(100),
  plan: text("plan").notNull().default("free"),
  avatarUrl: text("avatar_url"),
  wallpaperUrl: text("wallpaper_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quizzesTable = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  questions: jsonb("questions").notNull().default([]),
  difficulty: text("difficulty").notNull().default("medium"),
  quizType: text("quiz_type").notNull().default("study"),
  subjectName: text("subject_name"),
  shareSlug: text("share_slug").unique(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  bannerUrl: text("banner_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quizAttemptsTable = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  quizId: integer("quiz_id").notNull(),
  score: integer("score").notNull().default(0),
  total: integer("total").notNull().default(0),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const flashcardSetsTable = pgTable("flashcard_sets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull().default(""),
  cards: jsonb("cards").notNull().default([]),
  count: integer("count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const flashcardReviewsTable = pgTable("flashcard_reviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  setId: integer("set_id").notNull(),
  cardIndex: integer("card_index").notNull(),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(1),
  repetitions: integer("repetitions").notNull().default(0),
  nextReview: text("next_review"),
  lastReview: text("last_review"),
});

export const chatSessionsTable = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("New Chat"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditTransactionsTable = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull().default(""),
  reference: text("reference").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const streaksTable = pgTable("streaks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastStudyDate: text("last_study_date"),
  totalStudyDays: integer("total_study_days").notNull().default(0),
  updatedAt: text("updated_at"),
});

export const summariesTable = pgTable("summaries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
