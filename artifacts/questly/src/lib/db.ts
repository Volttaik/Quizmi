import { db } from "@workspace/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { coursesTable, questionsTable, type Question } from "@workspace/db";
export { db };
export * from "@workspace/db";


/**
 * Public non-authenticated reads for demos and preview routes.
 *
 * These helpers are intentionally read-only and never touch `purchases`
 * or perform any entitlement check — they exist so a visitor can see and
 * launch free demo courses before signing in.
 */
export async function publicCourseBySlug(slug: string) {
  return db.query.coursesTable.findFirst({ where: eq(coursesTable.slug, slug) });
}

export async function publicQuestionIdsForCourse(courseId: number, count: number) {
  const rows = await db
    .select({ id: questionsTable.id })
    .from(questionsTable)
    .where(eq(questionsTable.courseId, courseId))
    .orderBy(sql`random()`)
    .limit(count);
  return rows.map((row) => row.id);
}

export async function publicQuestionsByIds(courseId: number, ids: number[]) {
  if (ids.length === 0) return [];
  const found = new Map<number, Question>();
  for (let offset = 0; offset < ids.length; offset += 400) {
    const chunk = ids.slice(offset, offset + 400);
    const rows = await db
      .select()
      .from(questionsTable)
      .where(
        and(
          eq(questionsTable.courseId, courseId),
          inArray(questionsTable.id, chunk)
        )
      );
    for (const row of rows) found.set(row.id, row);
  }
  return ids.map((id) => found.get(id)).filter((row): row is Question => Boolean(row));
}
