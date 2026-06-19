import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
  reference: text("reference"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const schema = {
  usersTable,
  quizzesTable,
  quizAttemptsTable,
  flashcardSetsTable,
  summariesTable,
  creditTransactionsTable,
};

export const db = drizzle(pool, { schema });

export async function ensureTablesExist() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_id VARCHAR(255) NOT NULL UNIQUE,
        name TEXT NOT NULL DEFAULT 'Learner',
        email TEXT NOT NULL DEFAULT '',
        credits INTEGER NOT NULL DEFAULT 100,
        plan VARCHAR(50) NOT NULL DEFAULT 'free',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
        questions JSONB NOT NULL DEFAULT '[]',
        question_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        quiz_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        completed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS flashcard_sets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        cards JSONB NOT NULL DEFAULT '[]',
        count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS summaries (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        topic TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS credit_transactions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        amount INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'usage',
        description TEXT NOT NULL DEFAULT '',
        reference TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT credit_transactions_reference_unique UNIQUE (reference)
      );
    `);
  } finally {
    client.release();
  }
}
