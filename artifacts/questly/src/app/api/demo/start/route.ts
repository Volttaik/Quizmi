import { cookies as nextCookies } from "next/headers";
import type { NextRequest } from "next/server";
import { publicCourseBySlug, publicQuestionIdsForCourse, publicQuestionsByIds } from "@/lib/db";
import { isSupportedDuration } from "@/lib/course-config";
import { deadline } from "@/lib/scoring";
import { apiError, apiOk, isNonEmptyString, readJson } from "@/lib/http";

const DEMO_SLUG = "demo-english-usage";
const TEMP_USER_COOKIE = "quizmi_demo_user_id";
const TEMP_USER_PREFIX = "demo-";

async function tempUserId(cookieStore: Awaited<ReturnType<typeof nextCookies>>) {
  let value = cookieStore.get(TEMP_USER_COOKIE)?.value;
  if (!value) {
    value = `${TEMP_USER_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cookieStore.set(TEMP_USER_COOKIE, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  if (!value.startsWith(TEMP_USER_PREFIX)) {
    return null;
  }
  const id = Number(value.slice(TEMP_USER_PREFIX.length));
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

export async function POST(req: NextRequest) {
  const user = await tempUserId(await nextCookies());
  if (user === null) return apiError("Unable to start a demo attempt right now.", 500);

  const course = await publicCourseBySlug(DEMO_SLUG);
  if (!course || !course.isPublished) return apiError("The demo course is not available right now.", 503);
  if (course.priceKobo > 0) return apiError("This demo route is only for free courses.", 403);
  if ((course.questionCount ?? 0) < 1) return apiError("The demo course has no questions yet.", 409);

  const body = await readJson<{ questionCount?: unknown; durationMinutes?: unknown }>(req);
  if (body && isNonEmptyString(body.questionCount)) {
    // Ignore plain-text question counts here; the runner still chooses its own
    // subset size, and the demo already defaults to a sensible value.
  }

  let duration: number | null;
  if (body?.durationMinutes === undefined) {
    duration = isSupportedDuration(course.durationMinutes) ? (course.durationMinutes ?? null) : null;
  } else if (body.durationMinutes === null) {
    duration = null;
  } else {
    const parsed = Number(body.durationMinutes);
    if (!isSupportedDuration(parsed)) return apiError("Choose a supported timer option (10 to 60 minutes, or unlimited).", 400);
    duration = parsed;
  }

  const available = course.questionCount ?? 0;
  const requested = Math.min(20, available);
  if (requested < 1) return apiError("This demo course has no questions to attempt.", 409);

  const questionIds = await publicQuestionIdsForCourse(course.id, requested);
  if (questionIds.length < 1) return apiError("The demo course has no questions to attempt.", 409);

  const questions = await publicQuestionsByIds(course.id, questionIds);

  return apiOk(
    {
      id: -1,
      courseId: course.id,
      courseSlug: course.slug,
      courseTitle: course.title,
      subject: course.subject,
      status: "in_progress",
      startedAt: new Date().toISOString(),
      expiresAt: deadline(duration, new Date()),
      secondsRemaining: duration ? 60 * duration : 0,
      durationMinutes: duration,
      passScore: course.passScore,
      totalMarks: questions.reduce((total, q) => total + (q.marks || 1), 0),
      questions: questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: Array.isArray(q.options) ? q.options : [],
        marks: q.marks || 1,
        imageUrl: q.imageUrl,
        orderIndex: q.orderIndex,
      })),
      answers: [],
      departures: 0,
      maxDepartures: 3,
    },
    201
  );
}
