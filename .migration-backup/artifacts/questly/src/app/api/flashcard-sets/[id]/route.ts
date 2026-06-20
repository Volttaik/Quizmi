import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, flashcardSetsTable } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const setId = parseInt(id);
  if (isNaN(setId)) return NextResponse.json({ error: "Invalid set ID" }, { status: 400 });

  try {
    const existing = await db.query.flashcardSetsTable.findFirst({
      where: and(eq(flashcardSetsTable.id, setId), eq(flashcardSetsTable.userId, userId)),
      columns: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "Flashcard set not found" }, { status: 404 });
    await db.delete(flashcardSetsTable).where(and(eq(flashcardSetsTable.id, setId), eq(flashcardSetsTable.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/flashcard-sets/[id] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
