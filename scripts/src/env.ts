import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Scripts run from the workspace root, the scripts package or a filtered
 * package. Look in the usual places and load the first env files found.
 * Existing process env always wins.
 */
const candidates = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "artifacts/questly/.env.local"),
  path.resolve(process.cwd(), "../artifacts/questly/.env.local"),
];

for (const file of candidates) {
  if (!existsSync(file)) continue;
  const contents = readFileSync(file, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
