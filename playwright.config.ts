import playwright from "../RestaurantCommon/node_modules/@playwright/test/index.js";
const { defineConfig } = playwright;
export default defineConfig({
  testDir: "tests",
  testMatch: "*.spec.ts",
  timeout: 180000,
  workers: 1,
  outputDir: "test-results",
  reporter: [["list"]],
  use: {
    channel: "chrome",
    locale: "cs-CZ",
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: { args: ["--enable-webgl", "--ignore-gpu-blocklist"] },
  },
  webServer: {
    command: "node ../RestaurantCommon/scripts/serve.mjs world",
    port: 4176,
    reuseExistingServer: true,
  },
});
