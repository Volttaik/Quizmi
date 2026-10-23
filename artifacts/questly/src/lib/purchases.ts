import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, coursesTable, paymentsTable, purchasesTable, questionsTable } from "@/lib/db";
import { getCourseBySlug, isCoursePurchased } from "@/lib/courses";
import {
  PaystackError,
  initializeTransaction,
  verifyTransaction,
} from "@/lib/paystack";

export type PaymentIntentResult =
  | { kind: "free"; courseSlug: string }
  | { kind: "owned"; courseSlug: string }
  | {
      kind: "redirect";
      courseSlug: string;
      authorizationUrl: string;
      reference: string;
    };

export type FulfilResult =
  | { ok: true; courseSlug: string; reference: string; alreadyProcessed: boolean }
  | { ok: false; error: string; status: number };

function callbackUrl(origin: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  return `${configured || origin.replace(/\/+$/, "")}/api/payments/callback`;
}

function newReference(userId: number, courseId: number): string {
  return `QM-${courseId}-${userId}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
}

export async function createPaymentIntent(
  user: { id: number; email: string },
  courseSlug: string,
  origin: string
): Promise<PaymentIntentResult> {
  const course = await getCourseBySlug(courseSlug);
  if (!course || !course.isPublished) {
    throw new PaystackError("Course not found", 404);
  }

  if (course.priceKobo <= 0) {
    return { kind: "free", courseSlug: course.slug };
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questionsTable)
    .where(eq(questionsTable.courseId, course.id));
  if (Number(count) === 0) {
    throw new PaystackError("This course does not have questions available yet.", 409);
  }

  if (await isCoursePurchased(user.id, course.id)) {
    return { kind: "owned", courseSlug: course.slug };
  }

  const email = user.email.trim();
  if (!email.includes("@")) {
    throw new PaystackError(
      "Your account needs an email address before you can pay for a course.",
      400
    );
  }

  const reference = newReference(user.id, course.id);
  const currency = course.currency.toUpperCase();

  const [payment] = await db
    .insert(paymentsTable)
    .values({
      reference,
      userId: user.id,
      courseId: course.id,
      amountKobo: course.priceKobo,
      currency,
      status: "pending",
    })
    .returning();

  try {
    const initialized = await initializeTransaction({
      email,
      amountKobo: course.priceKobo,
      currency,
      reference,
      callbackUrl: callbackUrl(origin),
      metadata: {
        courseId: course.id,
        courseSlug: course.slug,
        userId: user.id,
      },
    });

    await db
      .update(paymentsTable)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(paymentsTable.id, payment.id));

    return {
      kind: "redirect",
      courseSlug: course.slug,
      authorizationUrl: initialized.authorizationUrl,
      reference,
    };
  } catch (error) {
    await db
      .update(paymentsTable)
      .set({ status: "failed", updatedAt: new Date().toISOString() })
      .where(eq(paymentsTable.id, payment.id));
    throw error;
  }
}

/**
 * Verifies a Paystack reference against the server's recorded payment, then
 * creates the entitlement. Re-running is safe: the purchase has a unique
 * (user, course) index and an already-successful payment short-circuits.
 */
export async function fulfilPayment(reference: string): Promise<FulfilResult> {
  const payment = await db.query.paymentsTable.findFirst({
    where: eq(paymentsTable.reference, reference),
  });
  if (!payment) {
    return { ok: false, error: "Payment reference not found", status: 404 };
  }

  const course = await db.query.coursesTable.findFirst({
    where: eq(coursesTable.id, payment.courseId),
  });
  if (!course) {
    return { ok: false, error: "Course not found", status: 404 };
  }

  const existing = await db.query.purchasesTable.findFirst({
    where: and(
      eq(purchasesTable.userId, payment.userId),
      eq(purchasesTable.courseId, payment.courseId)
    ),
    columns: { id: true },
  });

  if (payment.status === "success" && existing) {
    return {
      ok: true,
      courseSlug: course.slug,
      reference: payment.reference,
      alreadyProcessed: true,
    };
  }

  const transaction = await verifyTransaction(payment.reference);

  if (transaction.status !== "success") {
    await db
      .update(paymentsTable)
      .set({ status: transaction.status === "abandoned" ? "abandoned" : "failed", updatedAt: new Date().toISOString() })
      .where(eq(paymentsTable.id, payment.id));
    return {
      ok: false,
      error: "Paystack has not confirmed this payment yet. Try again in a moment.",
      status: 402,
    };
  }

  if (
    transaction.reference !== payment.reference ||
    transaction.amount !== payment.amountKobo ||
    transaction.currency !== payment.currency.toUpperCase()
  ) {
    // The amount or currency was tampered with, or the reference belongs to a
    // different transaction. Never grant access in that case.
    await db
      .update(paymentsTable)
      .set({ status: "failed", updatedAt: new Date().toISOString() })
      .where(eq(paymentsTable.id, payment.id));
    return {
      ok: false,
      error: "This payment did not match the course price and could not be verified.",
      status: 400,
    };
  }

  const paidAt = transaction.paidAt ?? new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx
      .update(paymentsTable)
      .set({
        status: "success",
        providerReference: transaction.providerReference,
        paidAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(paymentsTable.id, payment.id));

    await tx
      .insert(purchasesTable)
      .values({
        userId: payment.userId,
        courseId: payment.courseId,
        paymentId: payment.id,
        amountKobo: payment.amountKobo,
        currency: payment.currency,
        purchasedAt: paidAt,
      })
      .onConflictDoNothing();
  });

  return {
    ok: true,
    courseSlug: course.slug,
    reference: payment.reference,
    alreadyProcessed: false,
  };
}
