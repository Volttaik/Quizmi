import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const createdAt = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

/* ────────────────────────────────────────────────────────────────────────────
 * Accounts
 *
 * Authentication itself lives in Clerk. This table is the local profile and
 * the owner of purchases and attempts.
 * ──────────────────────────────────────────────────────────────────────────── */

export const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull().default("Learner"),
  email: text("email").notNull().default(""),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull().default(createdAt),
  updatedAt: text("updated_at").notNull().default(createdAt),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;

/* ────────────────────────────────────────────────────────────────────────────
 * Courses
 *
 * Courses are the product. Content is written directly to these tables by the
 * course ingestion workflow — there is no in-app authoring surface. A course
 * owns any number of questions (the engine supports 1,000+) and may be free or
 * paid. Prices are stored in the currency's smallest unit (kobo for NGN) so
 * payment amounts are always integers.
 * ──────────────────────────────────────────────────────────────────────────── */

export const coursesTable = sqliteTable(
  "courses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    /** Optional course code as assigned by the institution, e.g. "GST 112". */
    code: text("code"),
    description: text("description").notNull().default(""),
    subject: text("subject"),
    /** "easy" | "medium" | "hard" */
    difficulty: text("difficulty").notNull().default("medium"),
    /** Authoritative price charged by Paystack, in the currency subunit. */
    priceKobo: integer("price_kobo").notNull().default(0),
    currency: text("currency").notNull().default("NGN"),
    /** Percentage required to pass (0-100). */
    passScore: integer("pass_score").notNull().default(50),
    /** null = unlimited attempts per learner. */
    maxAttempts: integer("max_attempts"),
    /** Suggested timer; learners still choose from the supported durations. */
    durationMinutes: integer("duration_minutes"),
    /** Cached count; the engine always counts rows for eligibility checks. */
    questionCount: integer("question_count").notNull().default(0),
    isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    coverImageUrl: text("cover_image_url"),
    createdAt: text("created_at").notNull().default(createdAt),
    updatedAt: text("updated_at").notNull().default(createdAt),
  },
  (t) => [
    index("courses_published_idx").on(t.isPublished, t.featured),
    index("courses_subject_idx").on(t.subject),
  ]
);

export type Course = typeof coursesTable.$inferSelect;
export type InsertCourse = typeof coursesTable.$inferInsert;

export const questionsTable = sqliteTable(
  "questions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    courseId: integer("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    options: text("options", { mode: "json" }).notNull().$type<string[]>(),
    correctIndex: integer("correct_index").notNull().default(0),
    explanation: text("explanation"),
    reference: text("reference"),
    imageUrl: text("image_url"),
    marks: integer("marks").notNull().default(1),
    orderIndex: integer("order_index").notNull().default(0),
  },
  (t) => [index("questions_course_idx").on(t.courseId, t.orderIndex)]
);

export type Question = typeof questionsTable.$inferSelect;
export type InsertQuestion = typeof questionsTable.$inferInsert;

/* ────────────────────────────────────────────────────────────────────────────
 * Payments & purchases
 *
 * A payment tracks one Paystack attempt. A purchase is the durable entitlement:
 * the unique (user, course) index makes repeated callbacks and webhooks
 * idempotent. Payment references are unique on the provider side too.
 * ──────────────────────────────────────────────────────────────────────────── */

export const paymentsTable = sqliteTable(
  "payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    reference: text("reference").notNull().unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    amountKobo: integer("amount_kobo").notNull(),
    currency: text("currency").notNull().default("NGN"),
    /** "pending" | "success" | "failed" | "abandoned" */
    status: text("status").notNull().default("pending"),
    provider: text("provider").notNull().default("paystack"),
    providerReference: text("provider_reference"),
    paidAt: text("paid_at"),
    createdAt: text("created_at").notNull().default(createdAt),
    updatedAt: text("updated_at").notNull().default(createdAt),
  },
  (t) => [
    index("payments_user_idx").on(t.userId),
    index("payments_course_idx").on(t.courseId),
  ]
);

export type Payment = typeof paymentsTable.$inferSelect;
export type InsertPayment = typeof paymentsTable.$inferInsert;

export const purchasesTable = sqliteTable(
  "purchases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    paymentId: integer("payment_id").references(() => paymentsTable.id, {
      onDelete: "set null",
    }),
    amountKobo: integer("amount_kobo").notNull().default(0),
    currency: text("currency").notNull().default("NGN"),
    purchasedAt: text("purchased_at").notNull().default(createdAt),
  },
  (t) => [
    uniqueIndex("purchases_user_course_unique").on(t.userId, t.courseId),
    index("purchases_course_idx").on(t.courseId),
  ]
);

export type Purchase = typeof purchasesTable.$inferSelect;
export type InsertPurchase = typeof purchasesTable.$inferInsert;

/* ────────────────────────────────────────────────────────────────────────────
 * Attempts
 * ──────────────────────────────────────────────────────────────────────────── */

export type StoredAnswer = {
  questionId: number;
  selectedIndex: number | null;
  correct: boolean;
  marksAwarded: number;
};

export type ViolationEntry = {
  at: string;
  reason: string;
};

export const attemptsTable = sqliteTable(
  "attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    /** "in_progress" | "submitted" | "expired" | "terminated" */
    status: text("status").notNull().default("in_progress"),
    startedAt: text("started_at").notNull().default(createdAt),
    /** Server-authoritative deadline. null = unlimited time. */
    expiresAt: text("expires_at"),
    /** Timer selected at launch. null = unlimited time. */
    durationMinutes: integer("duration_minutes"),
    /** Ordered question ids chosen for this attempt. */
    questionIds: text("question_ids", { mode: "json" })
      .notNull()
      .default(sql`'[]'`)
      .$type<number[]>(),
    /** Draft answers while open, final answers once closed. */
    answers: text("answers", { mode: "json" })
      .notNull()
      .default(sql`'[]'`)
      .$type<StoredAnswer[]>(),
    departures: integer("departures").notNull().default(0),
    lastDepartureAt: text("last_departure_at"),
    lastSeenAt: text("last_seen_at"),
    violationLog: text("violation_log", { mode: "json" })
      .notNull()
      .default(sql`'[]'`)
      .$type<ViolationEntry[]>(),
    submittedAt: text("submitted_at"),
    score: integer("score").notNull().default(0),
    totalMarks: integer("total_marks").notNull().default(0),
    percentage: integer("percentage").notNull().default(0),
    passed: integer("passed", { mode: "boolean" }).notNull().default(false),
    timeTakenSeconds: integer("time_taken_seconds"),
    terminationReason: text("termination_reason"),
  },
  (t) => [
    index("attempts_user_course_idx").on(t.userId, t.courseId),
    index("attempts_user_status_idx").on(t.userId, t.status),
    index("attempts_status_idx").on(t.status),
    index("attempts_course_idx").on(t.courseId),
    uniqueIndex("attempts_open_unique")
      .on(t.userId, t.courseId)
      .where(sql`${t.status} = 'in_progress'`),
  ]
);

export type Attempt = typeof attemptsTable.$inferSelect;
export type InsertAttempt = typeof attemptsTable.$inferInsert;
