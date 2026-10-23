/**
 * Checks the Turso connection and schema. Pass --write to also insert, read
 * and delete a temporary course row, proving the app can write real records.
 * The write test is opt-in so it is never run against production by accident.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run db:verify
 *   pnpm --filter @workspace/scripts run db:verify -- --write
 */
import "./env";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL is not set.");
  process.exit(1);
}

const databaseUrl = url;

const REQUIRED_TABLES = ["users", "courses", "questions", "payments", "purchases", "attempts"];

const client = createClient({ url: databaseUrl, authToken });

async function main() {
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  );
  const present = new Set(tables.rows.map((row) => String(row.name)));
  const missing = REQUIRED_TABLES.filter((table) => !present.has(table));

  if (missing.length > 0) {
    throw new Error(`Missing tables: ${missing.join(", ")}. Run db:migrate first.`);
  }

  const migrationRows = await client.execute(
    "SELECT name, applied_at FROM _migrations ORDER BY name",
  );
  console.log(`connected to Turso (${databaseUrl.replace(/\/\/.*@/, "//")})`);
  console.log(
    `tables: ${REQUIRED_TABLES.join(", ")}; migrations: ${migrationRows.rows
      .map((row) => String(row.name))
      .join(", ")}`,
  );

  if (!process.argv.includes("--write")) {
    console.log("read check passed. Re-run with -- --write to test a real write.");
    client.close();
    return;
  }

  const slug = `__quizme_verify_${Date.now()}`;
  await client.execute({
    sql: `INSERT INTO courses (slug, title, description, price_kobo, question_count, is_published)
          VALUES (?, ?, ?, ?, ?, 0)`,
    args: [slug, "Verification course", "Temporary row created by db:verify", 0, 0],
  });

  const readBack = await client.execute({
    sql: "SELECT id, slug, title FROM courses WHERE slug = ?",
    args: [slug],
  });

  if (readBack.rows.length !== 1) {
    throw new Error("Temporary course could not be read back");
  }

  const id = Number(readBack.rows[0].id);
  await client.execute({ sql: "DELETE FROM courses WHERE id = ?", args: [id] });

  const deleted = await client.execute({
    sql: "SELECT id FROM courses WHERE id = ?",
    args: [id],
  });
  if (deleted.rows.length !== 0) {
    throw new Error("Temporary course could not be deleted");
  }

  console.log("write check passed (temporary course inserted, read and deleted).");
  client.close();
}

main().catch((error) => {
  console.error("database verification failed:", error);
  process.exit(1);
});
