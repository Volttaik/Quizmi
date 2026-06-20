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
      const clerkUser = (req as any).auth?.user ?? null;
      const name = clerkUser?.firstName
        ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
        : "Learner";
      const email =
        clerkUser?.primaryEmailAddress?.emailAddress ??
        clerkUser?.emailAddresses?.[0]?.emailAddress ??
        "";

      const [created] = await db
        .insert(usersTable)
        .values({ clerkId: userId, name, email, credits: 100, plan: "free" })
        .onConflictDoNothing()
        .returning();

      user =
        created ??
        (await db.query.usersTable.findFirst({
          where: eq(usersTable.clerkId, userId),
        }));
    }

    return res.json(user);
  } catch (err) {
    req.log.error({ err }, "GET /user error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/user", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { name, email } = req.body as { name?: string; email?: string };

  try {
    const [updated] = await db
      .update(usersTable)
      .set({ ...(name ? { name } : {}), ...(email ? { email } : {}) })
      .where(eq(usersTable.clerkId, userId))
      .returning();
    return res.json(updated);
  } catch (err) {
    req.log.error({ err }, "PATCH /user error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
