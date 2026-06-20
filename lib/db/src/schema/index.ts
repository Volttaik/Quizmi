import {
  sqliteTable,
  integer,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

export const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull().default("Learner"),
  email: text("email").notNull().default(""),
  credits: integer("credits").notNull().default(100),
  plan: text("plan").notNull().default("free"),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const quizzesTable = sqliteTable("quizzes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  questions: text("questions", { mode: "json" }).notNull().default("[]"),
  questionCount: integer("question_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const quizAttemptsTable = sqliteTable("quiz_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  quizId: integer("quiz_id").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  completedAt: text("completed_at").notNull().default(sql`(datetime('now'))`),
});

export const flashcardSetsTable = sqliteTable("flashcard_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  cards: text("cards", { mode: "json" }).notNull().default("[]"),
  count: integer("count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const summariesTable = sqliteTable("summaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const creditTransactionsTable = sqliteTable("credit_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull().default("usage"),
  description: text("description").notNull().default(""),
  reference: text("reference").unique(),
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

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertQuizSchema = createInsertSchema(quizzesTable).omit({ id: true, createdAt: true });
export const insertFlashcardSetSchema = createInsertSchema(flashcardSetsTable).omit({ id: true, createdAt: true });
export const insertSummarySchema = createInsertSchema(summariesTable).omit({ id: true, createdAt: true });
export const insertCreditTransactionSchema = createInsertSchema(creditTransactionsTable).omit({ id: true, createdAt: true });

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Quiz = typeof quizzesTable.$inferSelect;
export type QuizAttempt = typeof quizAttemptsTable.$inferSelect;
export type FlashcardSet = typeof flashcardSetsTable.$inferSelect;
export type Summary = typeof summariesTable.$inferSelect;
export type CreditTransaction = typeof creditTransactionsTable.$inferSelect;
export type ChatSession = typeof chatSessionsTable.$inferSelect;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
