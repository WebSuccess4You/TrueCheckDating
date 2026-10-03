import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

const configuredChromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const systemChromiumPath = existsSync("/usr/bin/chromium")
  ? "/usr/bin/chromium"
  : undefined;
const chromiumPath = configuredChromiumPath ?? systemChromiumPath;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    ...(chromiumPath
      ? {
          launchOptions: {
            executablePath: chromiumPath,
            args: ["--no-sandbox"],
          },
        }
      : {}),
  },
  webServer: {
    command: "npm run dev -- --hostname localhost",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
