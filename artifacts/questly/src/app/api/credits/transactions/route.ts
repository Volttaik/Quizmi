import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, creditTransactionsTable } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const transactions = await db
      .select()
      .from(creditTransactionsTable)
      .where(eq(creditTransactionsTable.userId, userId))
      .orderBy(desc(creditTransactionsTable.createdAt))
      .limit(20);
    return NextResponse.json(transactions);
  } catch (err) {
    console.error("GET /api/credits/transactions error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
