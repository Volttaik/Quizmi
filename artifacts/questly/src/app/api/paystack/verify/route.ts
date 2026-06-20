import { NextRequest, NextResponse } from "next/server";
import { db, usersTable, creditTransactionsTable } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  if (!reference)
    return NextResponse.redirect(new URL("/payment/callback?status=failed&reason=no_reference", req.url));

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey)
    return NextResponse.redirect(new URL("/payment/callback?status=failed&reason=not_configured", req.url));

  try {
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    const data = (await paystackRes.json()) as {
      status: boolean;
      data?: { status: string; metadata?: { userId?: string; package?: string; credits?: number } };
    };

    if (!data.status || data.data?.status !== "success")
      return NextResponse.redirect(new URL("/payment/callback?status=failed&reason=payment_not_successful", req.url));

    const { userId, credits, package: pkg } = data.data.metadata ?? {};
    if (!userId || !credits)
      return NextResponse.redirect(new URL("/payment/callback?status=failed&reason=missing_metadata", req.url));

    const creditAmount = typeof credits === "number" ? credits : 500;

    let alreadyProcessed = false;
    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: creditTransactionsTable.id })
        .from(creditTransactionsTable)
        .where(eq(creditTransactionsTable.reference, reference))
        .limit(1);

      if (existing.length > 0) { alreadyProcessed = true; return; }

      await tx.update(usersTable).set({ credits: sql`${usersTable.credits} + ${creditAmount}` }).where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({
        userId, amount: creditAmount, type: "purchase",
        description: `Purchased ${creditAmount.toLocaleString()} credits (${pkg ?? "package"})`,
        reference,
      });
    });

    return NextResponse.redirect(new URL(`/payment/callback?status=success&credits=${creditAmount}&ref=${reference}`, req.url));
  } catch (err) {
    console.error("GET /api/paystack/verify error", err);
    return NextResponse.redirect(new URL("/payment/callback?status=failed&reason=server_error", req.url));
  }
}
