import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, flashcardSetsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sets = await db
    .select()
    .from(flashcardSetsTable)
    .where(eq(flashcardSetsTable.userId, userId))
    .orderBy(desc(flashcardSetsTable.createdAt))
    .limit(50);

  return NextResponse.json(sets);
}
