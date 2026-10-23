/**
 * Applies versioned SQL migrations to the Turso database.
 *
 *   • Every file in lib/db/migrations is applied once, in filename order.
 *   • Applied migrations are recorded in _migrations with a checksum, so a
 *     later edit to an applied file fails loudly instead of drifting.
 *   • Migrations are idempotent (IF NOT EXISTS) and are not run on app startup;
 *     production data is never recreated or overwritten.
 *
 * Usage: pnpm --filter @workspace/scripts run db:migrate
 */
import "./env";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL is not set. Configure the Turso database first.");
  process.exit(1);
}

const client = createClient({ url, authToken });
const migrationsDir = fileURLToPath(new URL("../../lib/db/migrations", import.meta.url));

function statementsFor(sql: string): string[] {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function main() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);

  const appliedRows = await client.execute("SELECT name, checksum FROM _migrations");
  const applied = new Map(
    appliedRows.rows.map((row) => [String(row.name), String(row.checksum)])
  );

  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  let ran = 0;
  for (const file of files) {
    const sql = readFileSync(path.join(migrationsDir, file), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const previous = applied.get(file);

    if (previous) {
      if (previous !== checksum) {
        throw new Error(
          `Migration ${file} has changed after it was applied. Add a new migration instead of editing history.`,
        );
      }
      continue;
    }

    const statements = statementsFor(sql);
    if (statements.length === 0) continue;

    // A libSQL batch is executed atomically, so a failing migration leaves no
    // partial schema behind and is not recorded.
    await client.batch(
      [
        ...statements.map((statement) => ({ sql: statement, args: [] })),
        {
          sql: "INSERT INTO _migrations (name, checksum, applied_at) VALUES (?, ?, ?)",
          args: [file, checksum, new Date().toISOString()],
        },
      ],
      "write",
    );

    console.log(`applied ${file} (${statements.length} statements)`);
    ran += 1;
  }

  console.log(ran === 0 ? "database is up to date" : `applied ${ran} migration(s)`);
  client.close();
}

main().catch((error) => {
  console.error("migration failed:", error);
  process.exit(1);
});
