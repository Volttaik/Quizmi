import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, creditTransactionsTable } from "../lib/db.js";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/credits", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.clerkId, userId),
      columns: { credits: true },
    });
    return res.json({ credits: user?.credits ?? 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/credits/transactions", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const transactions = await db
      .select()
      .from(creditTransactionsTable)
      .where(eq(creditTransactionsTable.userId, userId))
      .orderBy(desc(creditTransactionsTable.createdAt))
      .limit(20);
    return res.json(transactions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
