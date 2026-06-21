import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL (or DATABASE_URL) must be set.");
}

export default defineConfig({
  schema: "../../lib/db/src/schema/index.ts",
  dialect: "turso",
  dbCredentials: { url, authToken },
});
