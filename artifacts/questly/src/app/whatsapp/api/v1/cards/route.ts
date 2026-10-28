import type { NextRequest } from "next/server";
import { apiError, apiOk, isNonEmptyString, readJson } from "@/lib/http";
import { verifyBotRequest } from "@/lib/whatsapp-api/bot-auth";
import { recordCardMessage, resolveCardMessage } from "@/lib/whatsapp-api/cards";
import { findBotCourseByCode } from "@/lib/whatsapp-api/courses";

export const dynamic = "force-dynamic";

const JID_PATTERN = /^[0-9]{6,20}@s\.whatsapp\.net$/;
const MESSAGE_ID_PATTERN = /^[A-Za-z0-9_-]{6,128}$/;

/** Records the WhatsApp message ID of a course card the bot just sent. */
export async function POST(req: NextRequest) {
  const auth = verifyBotRequest(req);
  if (!auth.ok) return auth.response;

  const body = await readJson<{ jid?: unknown; messageId?: unknown; courseCode?: unknown }>(req);
  if (!body || !isNonEmptyString(body.jid) || !JID_PATTERN.test(body.jid)) {
    return apiError("A valid WhatsApp jid is required", 400);
  }
  if (!isNonEmptyString(body.messageId) || !MESSAGE_ID_PATTERN.test(body.messageId)) {
    return apiError("A valid messageId is required", 400);
  }
  if (!isNonEmptyString(body.courseCode)) return apiError("courseCode is required", 400);

  try {
    const course = await findBotCourseByCode(body.courseCode);
    if (!course) return apiError("Course not found", 404);
    await recordCardMessage(body.messageId, body.jid, course.id);
    return apiOk({ recorded: true });
  } catch (error) {
    console.error("POST /whatsapp/api/v1/cards failed", error);
    return apiError("Could not record card", 500);
  }
}

/** Resolves a quoted card to its course. Only cards sent to this same number resolve. */
export async function GET(req: NextRequest) {
  const auth = verifyBotRequest(req);
  if (!auth.ok) return auth.response;

  const jid = req.nextUrl.searchParams.get("jid") ?? "";
  const messageId = req.nextUrl.searchParams.get("messageId") ?? "";
  if (!JID_PATTERN.test(jid)) return apiError("A valid WhatsApp jid is required", 400);
  if (!MESSAGE_ID_PATTERN.test(messageId)) return apiError("A valid messageId is required", 400);

  try {
    const course = await resolveCardMessage(messageId, jid);
    if (!course) return apiOk({ course: null });
    return apiOk({ course: { code: course.code, slug: course.slug, title: course.title } });
  } catch (error) {
    console.error("GET /whatsapp/api/v1/cards failed", error);
    return apiError("Could not resolve card", 500);
  }
}
