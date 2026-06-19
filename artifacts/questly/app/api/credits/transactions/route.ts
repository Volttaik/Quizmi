import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, creditTransactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transactions = await db
    .select()
    .from(creditTransactionsTable)
    .where(eq(creditTransactionsTable.userId, userId))
    .orderBy(desc(creditTransactionsTable.createdAt))
    .limit(20);

  return NextResponse.json(transactions);
}
