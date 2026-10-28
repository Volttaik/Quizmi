import type { NextRequest } from "next/server";
import { apiError, apiOk, isNonEmptyString, readJson } from "@/lib/http";
import { createPaymentIntent } from "@/lib/purchases";
import { PaystackError } from "@/lib/paystack";
import { db, usersTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifyBotRequest } from "@/lib/whatsapp-api/bot-auth";
import { activeLinkForJid } from "@/lib/whatsapp-api/links";
import { findBotCourseByCode } from "@/lib/whatsapp-api/courses";
import { resolveCardMessage } from "@/lib/whatsapp-api/cards";
import { appOrigin } from "@/lib/share";

export const dynamic = "force-dynamic";

const JID_PATTERN = /^[0-9]{6,20}@s\.whatsapp\.net$/;

/**
 * Returns a Paystack checkout link for a linked student. Payment access is
 * granted only after Paystack verification (existing webhook/callback), so
 * the bot never grants access itself.
 */
export async function POST(req: NextRequest) {
  const auth = verifyBotRequest(req);
  if (!auth.ok) return auth.response;

  const body = await readJson<{ jid?: unknown; courseCode?: unknown; messageId?: unknown }>(req);
  if (!body || !isNonEmptyString(body.jid) || !JID_PATTERN.test(body.jid)) {
    return apiError("A valid WhatsApp jid is required", 400);
  }

  try {
    const link = await activeLinkForJid(body.jid);
    if (!link) return apiError("Link your WhatsApp with /login first", 403);

    // A quoted card identifies the course; otherwise the typed course code does.
    const course = isNonEmptyString(body.messageId)
      ? await resolveCardMessage(body.messageId, body.jid)
      : isNonEmptyString(body.courseCode)
        ? await findBotCourseByCode(body.courseCode)
        : null;
    if (!course) return apiError("Course not found", 404);

    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, link.userId) });
    if (!user) return apiError("Account not found", 404);

    const result = await createPaymentIntent({ id: user.id, email: user.email }, course.slug, appOrigin());
    if (result.kind === "redirect") {
      return apiOk({ kind: "redirect", url: result.authorizationUrl, reference: result.reference });
    }
    return apiOk({ kind: result.kind });
  } catch (error) {
    if (error instanceof PaystackError) return apiError(error.message, error.httpStatus);
    console.error("POST /whatsapp/api/v1/purchase failed", error);
    return apiError("Could not start checkout", 500);
  }
}
