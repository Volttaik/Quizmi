import { createApiClient } from "./api-client.js";
import { planReply, type ChatState } from "./commands/router.js";
import { loadConfig } from "./config.js";
import { log, setLogLevel } from "./logger.js";
import { startConnection } from "./whatsapp/connection.js";

async function main(): Promise<void> {
  const config = loadConfig();
  setLogLevel(config.logLevel);
  const api = createApiClient(config);

  const chats = new Map<string, ChatState>();
  const stop = await startConnection(
    config.sessionDir,
    (message) => planReply(message, api, { chats }),
    (messageId, jid, courseCode) => api.recordCard(jid, messageId, courseCode)
  );
  log.info("bot.started", { apiBaseUrl: config.apiBaseUrl });

  const shutdown = (signal: string) => {
    log.info("bot.stopping", { signal });
    stop();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  log.error("bot.fatal", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
