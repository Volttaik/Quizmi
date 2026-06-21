import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error(
    "TURSO_DATABASE_URL must be set. Did you forget to configure Turso?",
  );
}

export const client = createClient({ url, authToken });
export const db = drizzle(client, { schema });

export * from "./schema";
