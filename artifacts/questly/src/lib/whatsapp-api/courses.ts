import { and, eq, sql } from "drizzle-orm";
import { db, coursesTable, type Course } from "@/lib/db";
import { buildCourseDetail, listPublishedCourses, listCourseChapters } from "@/lib/courses";
import { courseShareUrl } from "@/lib/share";

/**
 * Bot-facing course shape. Deliberately omits per-learner fields (purchase
 * state, attempts). Those are only returned to a linked student, once account
 * linking exists.
 */
export type BotCourse = {
  code: string | null;
  slug: string;
  title: string;
  subject: string | null;
  description: string;
  priceKobo: number;
  currency: string;
  questionCount: number;
  durationMinutes: number | null;
  passScore: number;
  /** Existing cover image from the course record, or null when none is set. */
  coverImageUrl: string | null;
  /** Canonical QuizMe page for the course, built by the same helper as the website share links. */
  url: string;
};

export type BotCourseDetail = BotCourse & {
  chapters: { number: number; title: string; questionCount: number }[];
};

function toBotCourse(summary: {
  code: string | null;
  slug: string;
  title: string;
  subject: string | null;
  description: string;
  priceKobo: number;
  currency: string;
  questionCount: number;
  durationMinutes: number | null;
  passScore: number;
  coverImageUrl: string | null;
}): BotCourse {
  return {
    code: summary.code,
    slug: summary.slug,
    title: summary.title,
    subject: summary.subject,
    description: summary.description,
    priceKobo: summary.priceKobo,
    currency: summary.currency,
    questionCount: summary.questionCount,
    durationMinutes: summary.durationMinutes,
    passScore: summary.passScore,
    coverImageUrl: summary.coverImageUrl ?? null,
    url: courseShareUrl(summary.slug),
  };
}

/** Published catalogue courses matching a query, same rules as the website. */
export async function searchBotCourses(
  query: string | undefined,
  limit: number,
  offset: number
): Promise<BotCourse[]> {
  const courses = await listPublishedCourses(
    { search: query, limit, offset },
    null
  );
  return courses.map(toBotCourse);
}

/**
 * Looks up one published course by institution code. Matching ignores spaces
 * and case, so "ecn101" finds "ECN 101", as on the website.
 */
export async function findBotCourseByCode(code: string): Promise<Course | undefined> {
  const normalised = code.replace(/\s+/g, "").toUpperCase();
  if (!normalised) return undefined;
  return db.query.coursesTable.findFirst({
    where: and(
      eq(coursesTable.isPublished, true),
      eq(sql`upper(replace(${coursesTable.code}, ' ', ''))`, normalised)
    ),
  });
}

export async function botCourseDetail(course: Course): Promise<BotCourseDetail | null> {
  const detail = await buildCourseDetail(course, null);
  if (detail.questionCount <= 0) return null;
  const chapters = await listCourseChapters(course.id);
  return {
    ...toBotCourse(detail),
    chapters: chapters.map((chapter) => ({
      number: chapter.number,
      title: chapter.title,
      questionCount: chapter.questionCount,
    })),
  };
}
