import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@/lib/db";
import { apiError, apiOk, isNonEmptyString } from "@/lib/http";
import { listPurchasedCourses } from "@/lib/courses";
import { verifyBotRequest } from "@/lib/whatsapp-api/bot-auth";
import { activeLinkForJid, unlinkJid } from "@/lib/whatsapp-api/links";

export const dynamic = "force-dynamic";

const JID_PATTERN = /^[0-9]{6,20}@s\.whatsapp\.net$/;

function jidFrom(req: NextRequest): string | null {
  const jid = req.nextUrl.searchParams.get("jid");
  return isNonEmptyString(jid) && JID_PATTERN.test(jid) ? jid : null;
}

/** The linked student's name and owned courses, for the bot's /mycourses. */
export async function GET(req: NextRequest) {
  const auth = verifyBotRequest(req);
  if (!auth.ok) return auth.response;

  const jid = jidFrom(req);
  if (!jid) return apiError("A valid WhatsApp jid is required", 400);

  try {
    const link = await activeLinkForJid(jid);
    if (!link) return apiOk({ linked: false });

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, link.userId),
      columns: { name: true },
    });
    const courses = await listPurchasedCourses(link.userId);
    return apiOk({
      linked: true,
      name: user?.name ?? "Learner",
      courses: courses.map((course) => ({
        code: course.code,
        slug: course.slug,
        title: course.title,
        attemptsUsed: course.attemptsUsed,
        bestPercentage: course.bestPercentage,
      })),
    });
  } catch (error) {
    console.error("GET /whatsapp/api/v1/account failed", error);
    return apiError("Could not load your account", 500);
  }
}

/** Ends the link for this number. The QuizMe account and its data are kept. */
export async function DELETE(req: NextRequest) {
  const auth = verifyBotRequest(req);
  if (!auth.ok) return auth.response;

  const jid = jidFrom(req);
  if (!jid) return apiError("A valid WhatsApp jid is required", 400);

  try {
    const unlinked = await unlinkJid(jid);
    return apiOk({ unlinked });
  } catch (error) {
    console.error("DELETE /whatsapp/api/v1/account failed", error);
    return apiError("Could not unlink", 500);
  }
}
