type Level = "debug" | "info" | "warn" | "error";

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const SECRET_KEY = /token|secret|password|authorization|cookie|creds|key/i;

let currentLevel: Level = "info";

export function setLogLevel(level: Level): void {
  currentLevel = level;
}

/** Replaces values of secret-looking keys so credentials never reach logs. */
export function redact(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = SECRET_KEY.test(key) ? "[redacted]" : value;
  }
  return out;
}

function write(level: Level, event: string, fields: Record<string, unknown> = {}): void {
  if (ORDER[level] < ORDER[currentLevel]) return;
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    event,
    ...redact(fields),
  });
  if (level === "error" || level === "warn") process.stderr.write(line + "\n");
  else process.stdout.write(line + "\n");
}

export const log = {
  debug: (event: string, fields?: Record<string, unknown>) => write("debug", event, fields),
  info: (event: string, fields?: Record<string, unknown>) => write("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => write("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => write("error", event, fields),
};
