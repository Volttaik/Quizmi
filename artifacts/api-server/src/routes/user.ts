import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "../lib/db.js";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/user", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    let user = await db.query.usersTable.findFirst({
      where: eq(usersTable.clerkId, userId),
    });

    if (!user) {
      const [created] = await db
        .insert(usersTable)
        .values({ clerkId: userId, name: "Learner", email: "", credits: 100, plan: "free" })
        .onConflictDoNothing()
        .returning();

      user = created ?? await db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, userId),
      });
    }

    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
