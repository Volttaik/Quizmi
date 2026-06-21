import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, flashcardSetsTable } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sets = await db
      .select()
      .from(flashcardSetsTable)
      .where(eq(flashcardSetsTable.userId, userId))
      .orderBy(desc(flashcardSetsTable.createdAt))
      .limit(200);
    return NextResponse.json(sets);
  } catch (err) {
    console.error("GET /api/flashcard-sets error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
