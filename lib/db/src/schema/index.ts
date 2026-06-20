import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  name: text("name").notNull().default("Learner"),
  email: text("email").notNull().default(""),
  credits: integer("credits").notNull().default(100),
  plan: varchar("plan", { length: 50 }).notNull().default("free"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quizzesTable = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull().default("medium"),
  questions: jsonb("questions").notNull().default([]),
  questionCount: integer("question_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quizAttemptsTable = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  quizId: integer("quiz_id").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const flashcardSetsTable = pgTable("flashcard_sets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  cards: jsonb("cards").notNull().default([]),
  count: integer("count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const summariesTable = pgTable("summaries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditTransactionsTable = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("usage"),
  description: text("description").notNull().default(""),
  reference: text("reference").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
