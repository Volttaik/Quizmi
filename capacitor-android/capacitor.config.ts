import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.questly.app",
  appName: "Questly",
  webDir: "www",
  server: {
    url: "https://questly.vercel.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
