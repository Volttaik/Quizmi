import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db, usersTable, creditTransactionsTable } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const data = event.data ?? {};
  const reference = data.reference as string | undefined;
  const status = data.status as string | undefined;
  const metadata = (data.metadata ?? {}) as { userId?: string; credits?: number; package?: string };

  if (status !== "success" || !reference) {
    return NextResponse.json({ received: true });
  }

  const { userId, credits, package: pkg } = metadata;
  if (!userId || !credits) return NextResponse.json({ received: true });

  const creditAmount = typeof credits === "number" ? credits : 0;
  if (creditAmount <= 0) return NextResponse.json({ received: true });

  try {
    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: creditTransactionsTable.id })
        .from(creditTransactionsTable)
        .where(eq(creditTransactionsTable.reference, reference))
        .limit(1);

      if (existing.length > 0) return;

      await tx
        .update(usersTable)
        .set({ credits: sql`${usersTable.credits} + ${creditAmount}` })
        .where(eq(usersTable.clerkId, userId));

      await tx.insert(creditTransactionsTable).values({
        userId,
        amount: creditAmount,
        type: "purchase",
        description: `Purchased ${creditAmount.toLocaleString()} credits (${pkg ?? "package"}) via webhook`,
        reference,
        createdAt: new Date().toISOString(),
      });
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
