export type Config = {
  apiBaseUrl: string;
  apiKey: string;
  sessionDir: string;
  logLevel: "debug" | "info" | "warn" | "error";
};

const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

/**
 * Reads configuration from the process environment. Throws a descriptive error
 * naming every missing variable so misconfiguration is caught at startup.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const missing: string[] = [];
  const required = (key: string): string => {
    const value = env[key]?.trim();
    if (!value) missing.push(key);
    return value ?? "";
  };

  const apiBaseUrl = required("QUIZMI_API_BASE_URL").replace(/\/+$/, "");
  const apiKey = required("QUIZMI_API_KEY");
  const sessionDir = (env.WHATSAPP_SESSION_DIR ?? "").trim() || "./.whatsapp-session";
  const rawLevel = (env.LOG_LEVEL ?? "info").trim().toLowerCase();
  const logLevel = (LOG_LEVELS as readonly string[]).includes(rawLevel)
    ? (rawLevel as Config["logLevel"])
    : "info";

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return { apiBaseUrl, apiKey, sessionDir, logLevel };
}
