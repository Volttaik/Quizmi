import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildCourseDetail, getCourseBySlug } from "@/lib/courses";
import { paystackConfigured } from "@/lib/paystack";
import { apiError, apiOk } from "@/lib/http";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();

  try {
    const course = await getCourseBySlug(slug);
    if (!course || !course.isPublished) return apiError("Course not found", 404);

    const detail = await buildCourseDetail(course, user?.id ?? null);
    return apiOk({ ...detail, paymentConfigured: paystackConfigured() });
  } catch (error) {
    console.error("GET /api/courses/[slug] failed", error);
    return apiError("Could not load this course", 500);
  }
}
