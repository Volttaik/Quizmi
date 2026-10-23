import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error(
    "TURSO_DATABASE_URL must be set. QUIZMI uses Turso as its only database; there is no local fallback.",
  );
}

if (!authToken && url.startsWith("libsql://")) {
  throw new Error(
    "TURSO_AUTH_TOKEN must be set for a remote Turso database. There is no local fallback.",
  );
}

/**
 * Next.js hot reload can re-evaluate module state. Keep one libSQL client per
 * process so we do not open a new connection pool on every reload.
 */
const globalForDb = globalThis as unknown as {
  quizmeClient?: ReturnType<typeof createClient>;
};

export const client =
  globalForDb.quizmeClient ??
  createClient({
    url,
    authToken,
    intMode: "number",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.quizmeClient = client;
}

export const db = drizzle(client, { schema });

export * from "./schema";
