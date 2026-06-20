import { defineConfig } from "drizzle-kit";
import path from "path";

const tursoUrl = process.env.TURSO_DATABASE_URL;

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  ...(tursoUrl
    ? {
        dialect: "turso" as const,
        dbCredentials: {
          url: tursoUrl,
          authToken: process.env.TURSO_AUTH_TOKEN ?? "",
        },
      }
    : {
        dialect: "sqlite" as const,
        dbCredentials: {
          url: path.resolve(__dirname, "../../artifacts/questly/dev.db"),
        },
      }),
});
