import { NextRequest, NextResponse } from "next/server";
import { db, usersTable, creditTransactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const CREDIT_PACKAGES: Record<string, number> = {
  starter: 500,
  standard: 1500,
  pro: 5000,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(new URL("/dashboard?payment=failed", req.url));
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.redirect(new URL("/dashboard?payment=failed", req.url));
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  const data = await res.json();
  if (!data.status || data.data?.status !== "success") {
    return NextResponse.redirect(new URL("/dashboard?payment=failed", req.url));
  }

  const { userId, package: pkg, credits } = data.data.metadata ?? {};
  if (!userId || !credits) {
    return NextResponse.redirect(new URL("/dashboard?payment=failed", req.url));
  }

  const creditAmount = typeof credits === "number" ? credits : CREDIT_PACKAGES[pkg] ?? 500;

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ credits: sql`${usersTable.credits} + ${creditAmount}` })
      .where(eq(usersTable.clerkId, userId));

    await tx.insert(creditTransactionsTable).values({
      userId,
      amount: creditAmount,
      type: "purchase",
      description: `Purchased ${creditAmount.toLocaleString()} credits`,
      reference,
    });
  });

  return NextResponse.redirect(new URL("/dashboard?payment=success", req.url));
}
