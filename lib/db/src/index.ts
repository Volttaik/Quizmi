import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error(
    "TURSO_DATABASE_URL (or DATABASE_URL) must be set. Did you add your Turso credentials in Secrets?"
  );
}

const client = createClient({ url, authToken });
export const db = drizzle(client, { schema });

export * from "./schema";
