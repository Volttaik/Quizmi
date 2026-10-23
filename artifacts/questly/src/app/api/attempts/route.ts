import type { NextRequest } from "next/server";
import { startAttemptForUser } from "@/lib/attempts";
import { loadAttemptHistory } from "@/lib/stats";
import { isSupportedDuration, isSupportedResultMode } from "@/lib/course-config";
import { apiError, apiOk, isNonEmptyString, readJson, requireSessionUser } from "@/lib/http";

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const user = session.user;

  try {
    // Same loader as analytics and the dashboard: one status model, one set of
    // counts, one place where expired drafts are closed.
    return apiOk({ items: await loadAttemptHistory(user.id) });
  } catch (error) {
    console.error("GET /api/attempts failed", error);
    return apiError("Could not load your attempt history", 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const user = session.user;

  const body = await readJson<{
    slug?: string;
    questionCount?: unknown;
    durationMinutes?: unknown;
    resultMode?: unknown;
    chapterNumber?: unknown;
  }>(req);
  if (!body || !isNonEmptyString(body.slug)) return apiError("Course slug is required");

  // null/omitted practises the whole course; a number must be a whole,
  // positive chapter number (the server verifies the chapter exists).
  let chapterNumber: number | null | undefined;
  if (body.chapterNumber === undefined) {
    chapterNumber = undefined;
  } else if (body.chapterNumber === null) {
    chapterNumber = null;
  } else {
    const parsedChapter = Number(body.chapterNumber);
    if (!Number.isInteger(parsedChapter) || parsedChapter < 1) {
      return apiError("Choose a chapter or practise the whole course");
    }
    chapterNumber = parsedChapter;
  }

  let duration: number | null | undefined;
  if (body.durationMinutes === undefined) {
    duration = undefined;
  } else if (body.durationMinutes === null) {
    duration = null;
  } else {
    const parsed = Number(body.durationMinutes);
    if (!isSupportedDuration(parsed)) {
      return apiError("Choose a supported timer option (10 to 60 minutes, or unlimited)");
    }
    duration = parsed;
  }

  const questionCount =
    body.questionCount === undefined ? undefined : Number(body.questionCount);

  if (body.resultMode !== undefined && !isSupportedResultMode(body.resultMode)) {
    return apiError("Choose Instant Results or Results at the End");
  }
  const resultMode = isSupportedResultMode(body.resultMode) ? body.resultMode : undefined;

  try {
    const result = await startAttemptForUser(user, body.slug.trim(), {
      questionCount,
      durationMinutes: duration,
      resultMode,
      chapterNumber,
    });
    if (!result.ok) return apiError(result.error, result.status);
    return apiOk(result.state, 201);
  } catch (error) {
    console.error("POST /api/attempts failed", error);
    return apiError("Could not start this assessment", 500);
  }
}
