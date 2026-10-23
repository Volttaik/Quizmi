import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fulfilPayment } from "@/lib/purchases";

/**
 * Paystack redirects here after checkout. Access is granted only after the
 * server verifies the transaction with Paystack; the redirect itself is never
 * treated as proof of payment.
 */
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference")?.trim();
  const origin = req.nextUrl.origin;

  if (!reference) {
    return NextResponse.redirect(new URL("/courses?payment=missing", origin));
  }

  try {
    const result = await fulfilPayment(reference);
    if (!result.ok) {
      return NextResponse.redirect(new URL("/courses?payment=failed", origin));
    }
    return NextResponse.redirect(
      new URL(`/courses/${result.courseSlug}?payment=success`, origin)
    );
  } catch (error) {
    console.error("Paystack callback verification failed", error);
    return NextResponse.redirect(new URL("/courses?payment=failed", origin));
  }
}
