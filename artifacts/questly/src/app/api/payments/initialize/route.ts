import type { NextRequest } from "next/server";
import { createPaymentIntent } from "@/lib/purchases";
import { PaystackError } from "@/lib/paystack";
import { apiError, apiOk, isNonEmptyString, readJson, requireSessionUser } from "@/lib/http";

export async function POST(req: NextRequest) {
  const session = await requireSessionUser("Sign in to purchase this course");
  if (!session.ok) return session.response;
  const user = session.user;

  const body = await readJson<{ slug?: string }>(req);
  if (!body || !isNonEmptyString(body.slug)) return apiError("Course slug is required");

  try {
    const result = await createPaymentIntent(user, body.slug.trim(), req.nextUrl.origin);
    return apiOk(result);
  } catch (error) {
    if (error instanceof PaystackError) {
      return apiError(error.message, error.httpStatus);
    }
    console.error("POST /api/payments/initialize failed", error);
    return apiError("Could not start this payment. Try again.", 500);
  }
}
