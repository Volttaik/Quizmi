import { apiError, apiOk } from "@/lib/http";
import { verifyBotRequest } from "@/lib/whatsapp-api/bot-auth";
import { botCourseDetail, findBotCourseByCode } from "@/lib/whatsapp-api/courses";

export const dynamic = "force-dynamic";

const CODE_PATTERN = /^[A-Za-z0-9 ]{2,20}$/;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const auth = verifyBotRequest(req);
  if (!auth.ok) return auth.response;

  const { code: raw } = await params;
  const code = decodeURIComponent(raw);
  if (!CODE_PATTERN.test(code)) {
    return apiError("Invalid course code", 400);
  }

  try {
    const course = await findBotCourseByCode(code);
    if (!course) return apiError("Course not found", 404);
    const detail = await botCourseDetail(course);
    if (!detail) return apiError("Course not found", 404);
    return apiOk({ course: detail });
  } catch (error) {
    console.error("GET /whatsapp/api/v1/courses/[code] failed", error);
    return apiError("Could not load course", 500);
  }
}
