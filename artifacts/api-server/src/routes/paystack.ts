import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, creditTransactionsTable } from "../lib/db.js";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const CREDIT_PACKAGES = {
  starter: { credits: 500, amount: 500 },
  standard: { credits: 1500, amount: 1200 },
  pro: { credits: 5000, amount: 3500 },
} as const;

router.post("/paystack/initialize", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const schema = z.object({
    package: z.enum(["starter", "standard", "pro"]),
    email: z.string().email().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(503).json({ error: "Paystack not configured. Please add PAYSTACK_SECRET_KEY in Secrets." });
  }

  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
    if (!user) return res.status(404).json({ error: "User not found" });

    const pkg = CREDIT_PACKAGES[parsed.data.package];
    const email = parsed.data.email ?? user.email;
    const baseUrl =
      process.env.APP_URL ??
      `https://${(process.env.REPLIT_DOMAINS ?? "localhost:3000").split(",")[0]}`;

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: pkg.amount * 100,
        callback_url: `${baseUrl}/api/paystack/verify`,
        metadata: { userId, package: parsed.data.package, credits: pkg.credits },
      }),
    });

    const data = (await paystackRes.json()) as {
      status: boolean;
      message?: string;
      data?: { authorization_url: string; reference: string };
    };
    if (!data.status) {
      return res.status(502).json({ error: data.message ?? "Failed to initialize payment" });
    }

    return res.json({ url: data.data!.authorization_url, reference: data.data!.reference });
  } catch (err) {
    req.log.error({ err }, "POST /paystack/initialize error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/paystack/verify", async (req, res) => {
  const reference = (req.query.reference ?? req.query.trxref) as string | undefined;
  if (!reference) return res.redirect("/dashboard?payment=failed");

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return res.redirect("/dashboard?payment=failed");

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );

    const data = (await paystackRes.json()) as {
      status: boolean;
      data?: { status: string; metadata?: { userId?: string; package?: string; credits?: number } };
    };

    if (!data.status || data.data?.status !== "success") {
      return res.redirect("/dashboard?payment=failed");
    }

    const { userId, credits } = data.data.metadata ?? {};
    if (!userId || !credits) return res.redirect("/dashboard?payment=failed");

    const creditAmount = typeof credits === "number" ? credits : 500;

    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: creditTransactionsTable.id })
        .from(creditTransactionsTable)
        .where(eq(creditTransactionsTable.reference, reference))
        .limit(1);

      if (existing.length > 0) return;

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

    return res.redirect("/dashboard?payment=success");
  } catch (err) {
    req.log.error({ err }, "GET /paystack/verify error");
    return res.redirect("/dashboard?payment=failed");
  }
});

export default router;
