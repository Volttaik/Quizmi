import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Use TURSO_DATABASE_URL for cloud Turso, or fall back to a local SQLite file for dev
const url = process.env.TURSO_DATABASE_URL ?? "file:./dev.db";

export const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export * from "./schema";
