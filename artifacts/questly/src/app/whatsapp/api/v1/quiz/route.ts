import type { NextRequest } from "next/server";
import { apiError, apiOk, isNonEmptyString, readJson } from "@/lib/http";
import { startAttemptForUser, finalizeAttempt, getAttemptForUser } from "@/lib/attempts";
import { getCourseById } from "@/lib/courses";
import { sanitizeAnswerInput } from "@/lib/scoring";
import { verifyBotRequest } from "@/lib/whatsapp-api/bot-auth";
import { activeLinkForJid } from "@/lib/whatsapp-api/links";
import { findBotCourseByCode } from "@/lib/whatsapp-api/courses";

export const dynamic = "force-dynamic";

const JID_PATTERN = /^[0-9]{6,20}@s\.whatsapp\.net$/;

async function linkedUserId(jid: string): Promise<number | null> {
  const link = await activeLinkForJid(jid);
  return link ? link.userId : null;
}

/**
 * Starts the default timed quiz for a linked student. Uses the same engine and
 * access rules as the website, so a course that is not purchased is refused.
 */
export async function POST(req: NextRequest) {
  const auth = verifyBotRequest(req);
  if (!auth.ok) return auth.response;

  const body = await readJson<{ jid?: unknown; courseCode?: unknown }>(req);
  if (!body || !isNonEmptyString(body.jid) || !JID_PATTERN.test(body.jid)) {
    return apiError("A valid WhatsApp jid is required", 400);
  }
  if (!isNonEmptyString(body.courseCode)) return apiError("courseCode is required", 400);

  try {
    const userId = await linkedUserId(body.jid);
    if (!userId) return apiError("Link your WhatsApp with /login first", 403);
    const course = await findBotCourseByCode(body.courseCode);
    if (!course) return apiError("Course not found", 404);

    const result = await startAttemptForUser({ id: userId }, course.slug);
    if (!result.ok) return apiError(result.error, result.status);
    return apiOk({
      attemptId: result.state.id,
      courseTitle: result.state.courseTitle,
      questions: result.state.questions.map((q) => ({ questionId: q.id, prompt: q.prompt, options: q.options })),
    });
  } catch (error) {
    console.error("POST /whatsapp/api/v1/quiz failed", error);
    return apiError("Could not start the quiz", 500);
  }
}

/**
 * Submits the student's letter answers (A–D mapped to option indexes) and
 * returns the score as text-friendly fields. Scoring runs on the server.
 */
export async function PUT(req: NextRequest) {
  const auth = verifyBotRequest(req);
  if (!auth.ok) return auth.response;

  const body = await readJson<{ jid?: unknown; attemptId?: unknown; answers?: unknown }>(req);
  if (!body || !isNonEmptyString(body.jid) || !JID_PATTERN.test(body.jid)) {
    return apiError("A valid WhatsApp jid is required", 400);
  }
  const attemptId = Number(body.attemptId);
  if (!Number.isInteger(attemptId) || attemptId <= 0) return apiError("attemptId is required", 400);
  if (!Array.isArray(body.answers)) return apiError("answers must be an array", 400);

  try {
    const userId = await linkedUserId(body.jid);
    if (!userId) return apiError("Link your WhatsApp with /login first", 403);
    const attempt = await getAttemptForUser(attemptId, userId);
    if (!attempt) return apiError("Attempt not found", 404);
    const course = await getCourseById(attempt.courseId);
    if (!course) return apiError("Course not found", 404);

    const result = await finalizeAttempt(attempt, course, sanitizeAnswerInput(body.answers));
    return apiOk({
      score: result.score,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      passed: result.passed,
      passScore: result.passScore,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      courseTitle: result.courseTitle,
    });
  } catch (error) {
    console.error("PUT /whatsapp/api/v1/quiz failed", error);
    return apiError("Could not submit the quiz", 500);
  }
}
