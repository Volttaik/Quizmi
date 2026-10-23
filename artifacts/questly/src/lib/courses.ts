import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import {
  db,
  attemptsTable,
  coursesTable,
  purchasesTable,
  questionsTable,
  type Course,
} from "@/lib/db";
import { attemptsRemaining } from "@/lib/scoring";
import { paystackConfigured } from "@/lib/paystack";
import type { CourseDetail, CourseSummary, Difficulty } from "@/lib/types";

export type CourseFilters = {
  search?: string;
  subject?: string;
  sort?: string;
  limit?: number;
  offset?: number;
};

type QuestionStats = { count: number; marks: number };
type AttemptStats = {
  used: number;
  best: number | null;
  last: number | null;
};

async function loadQuestionStats(courseIds: number[]): Promise<Map<number, QuestionStats>> {
  const stats = new Map<number, QuestionStats>();
  if (courseIds.length === 0) return stats;

  const rows = await db
    .select({
      courseId: questionsTable.courseId,
      count: sql<number>`count(*)`,
      marks: sql<number>`coalesce(sum(${questionsTable.marks}), 0)`,
    })
    .from(questionsTable)
    .where(inArray(questionsTable.courseId, courseIds))
    .groupBy(questionsTable.courseId);

  for (const row of rows) {
    stats.set(row.courseId, { count: Number(row.count), marks: Number(row.marks) });
  }
  return stats;
}

async function loadAttemptStats(
  userId: number | null,
  courseIds: number[]
): Promise<Map<number, AttemptStats>> {
  const stats = new Map<number, AttemptStats>();
  if (!userId || courseIds.length === 0) return stats;

  const rows = await db
    .select({
      id: attemptsTable.id,
      courseId: attemptsTable.courseId,
      status: attemptsTable.status,
      percentage: attemptsTable.percentage,
      submittedAt: attemptsTable.submittedAt,
    })
    .from(attemptsTable)
    .where(and(eq(attemptsTable.userId, userId), inArray(attemptsTable.courseId, courseIds)))
    .orderBy(desc(attemptsTable.id));

  for (const row of rows) {
    if (row.status === "in_progress") continue;

    const current = stats.get(row.courseId) ?? { used: 0, best: null, last: null };
    current.used += 1;

    // Rows are newest first, so the first completed result is the last score.
    if (current.last === null) current.last = row.percentage;
    current.best =
      current.best === null ? row.percentage : Math.max(current.best, row.percentage);
    stats.set(row.courseId, current);
  }

  return stats;
}

async function loadPurchasedCourseIds(
  userId: number | null,
  courseIds: number[]
): Promise<Set<number>> {
  if (!userId || courseIds.length === 0) return new Set();
  const rows = await db
    .select({ courseId: purchasesTable.courseId })
    .from(purchasesTable)
    .where(and(eq(purchasesTable.userId, userId), inArray(purchasesTable.courseId, courseIds)));
  return new Set(rows.map((row) => row.courseId));
}

function toSummary(
  course: Course,
  questions: QuestionStats | undefined,
  attempts: AttemptStats | undefined,
  purchased: boolean,
  purchasedAt: string | null = null
): CourseSummary {
  const isFree = course.priceKobo <= 0;
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    code: course.code ?? null,
    description: course.description ?? "",
    subject: course.subject,
    difficulty: course.difficulty as Difficulty,
    priceKobo: course.priceKobo,
    currency: course.currency,
    durationMinutes: course.durationMinutes ?? null,
    questionCount: questions?.count ?? 0,
    passScore: course.passScore,
    maxAttempts: course.maxAttempts ?? null,
    isFree,
    isFeatured: Boolean(course.featured),
    coverImageUrl: course.coverImageUrl,
    hasAccess: isFree || purchased,
    isPurchased: purchased,
    attemptsUsed: attempts?.used ?? 0,
    attemptsRemaining: attemptsRemaining(course.maxAttempts ?? null, attempts?.used ?? 0),
    bestPercentage: attempts?.best ?? null,
    lastPercentage: attempts?.last ?? null,
    purchasedAt,
  };
}

function buildConditions(filters: CourseFilters) {
  const conditions = [eq(coursesTable.isPublished, true)];

  // Search matches the stored course name, subject and description, plus the
  // optional course code. Code matching ignores spaces and case on both sides,
  // so "GST112", "gst 112" and "GST 112" all find the same course. Everything
  // reads live rows — nothing is hardcoded client-side.
  const needle = filters.search?.trim();
  if (needle) {
    const pattern = `%${needle}%`;
    const codeNeedle = needle.replace(/\s+/g, "").toLowerCase();
    const codeCondition = codeNeedle
      ? sql`replace(lower(${coursesTable.code}), ' ', '') like ${`%${codeNeedle}%`}`
      : sql`0`;
    conditions.push(
      or(
        like(coursesTable.title, pattern),
        like(coursesTable.description, pattern),
        like(coursesTable.subject, pattern),
        codeCondition
      )!
    );
  }
  if (filters.subject?.trim() && filters.subject !== "all") {
    conditions.push(eq(coursesTable.subject, filters.subject.trim()));
  }

  return conditions;
}

function orderFor(sort: string | undefined) {
  switch (sort) {
    case "newest":
      return [desc(coursesTable.createdAt), desc(coursesTable.id)];
    case "title":
      return [asc(coursesTable.title)];
    case "shortest":
      return [desc(coursesTable.featured), asc(coursesTable.durationMinutes), asc(coursesTable.title)];
    case "price-low":
      return [asc(coursesTable.priceKobo), asc(coursesTable.title)];
    default:
      return [desc(coursesTable.featured), desc(coursesTable.createdAt), asc(coursesTable.title)];
  }
}

export async function listPublishedCourses(
  filters: CourseFilters,
  userId: number | null
): Promise<CourseSummary[]> {
  const courses = await db
    .select()
    .from(coursesTable)
    .where(and(...buildConditions(filters)))
    .orderBy(...orderFor(filters.sort))
    .limit(Math.min(Math.max(filters.limit ?? 100, 1), 100))
    .offset(Math.max(filters.offset ?? 0, 0));

  const ids = courses.map((course) => course.id);
  const [purchased, attemptStats, questionStats] = await Promise.all([
    loadPurchasedCourseIds(userId, ids),
    loadAttemptStats(userId, ids),
    loadQuestionStats(ids),
  ]);

  return courses
    .map((course) =>
      toSummary(
        course,
        questionStats.get(course.id),
        attemptStats.get(course.id),
        purchased.has(course.id)
      )
    )
    // A published shell with no questions is not startable; keep it out of the
    // catalogue so learners only see courses they can actually take.
    .filter((course) => course.questionCount > 0);
}

export async function listSubjects(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ subject: coursesTable.subject })
    .from(coursesTable)
    .where(eq(coursesTable.isPublished, true));
  return rows
    .map((row) => row.subject)
    .filter((subject): subject is string => Boolean(subject && subject.trim()))
    .sort();
}

export async function getCourseBySlug(slug: string): Promise<Course | undefined> {
  return db.query.coursesTable.findFirst({ where: eq(coursesTable.slug, slug) });
}

export async function getCourseById(id: number): Promise<Course | undefined> {
  return db.query.coursesTable.findFirst({ where: eq(coursesTable.id, id) });
}

export async function isCoursePurchased(userId: number, courseId: number): Promise<boolean> {
  const row = await db.query.purchasesTable.findFirst({
    where: and(eq(purchasesTable.userId, userId), eq(purchasesTable.courseId, courseId)),
    columns: { id: true },
  });
  return Boolean(row);
}

export function courseHasAccess(course: Pick<Course, "priceKobo">, purchased: boolean): boolean {
  return course.priceKobo <= 0 || purchased;
}

export async function buildCourseDetail(
  course: Course,
  userId: number | null
): Promise<CourseDetail> {
  const [questionStats, attemptStats, averageRows, purchased] = await Promise.all([
    loadQuestionStats([course.id]),
    loadAttemptStats(userId, [course.id]),
    db
      .select({ average: sql<number>`coalesce(avg(${attemptsTable.percentage}), 0)` })
      .from(attemptsTable)
      .where(
        and(
          eq(attemptsTable.courseId, course.id),
          inArray(attemptsTable.status, ["submitted", "expired", "terminated"])
        )
      ),
    userId ? isCoursePurchased(userId, course.id) : Promise.resolve(false),
  ]);

  const questions = questionStats.get(course.id);
  const attempts = attemptStats.get(course.id);
  const average = Number(averageRows[0]?.average ?? 0);

  return {
    ...toSummary(course, questions, attempts, purchased),
    totalMarks: questions?.marks ?? 0,
    averagePercentage: Number.isFinite(average) && average > 0 ? Math.round(average) : null,
    createdAt: course.createdAt,
    paymentConfigured: paystackConfigured(),
  };
}

/** Courses the learner owns, newest purchase first. */
export async function listPurchasedCourses(userId: number): Promise<CourseSummary[]> {
  const rows = await db
    .select({ course: coursesTable, purchasedAt: purchasesTable.purchasedAt })
    .from(purchasesTable)
    .innerJoin(coursesTable, eq(purchasesTable.courseId, coursesTable.id))
    .where(and(eq(purchasesTable.userId, userId), eq(coursesTable.isPublished, true)))
    .orderBy(desc(purchasesTable.purchasedAt));

  const courses = rows.map((row) => row.course);
  const ids = courses.map((course) => course.id);
  const [questionStats, attemptStats] = await Promise.all([
    loadQuestionStats(ids),
    loadAttemptStats(userId, ids),
  ]);

  const purchasedAtByCourse = new Map(
    rows.map((row) => [row.course.id, row.purchasedAt] as const)
  );

  return courses.map((course) =>
    toSummary(
      course,
      questionStats.get(course.id),
      attemptStats.get(course.id),
      true,
      purchasedAtByCourse.get(course.id) ?? null
    )
  );
}
