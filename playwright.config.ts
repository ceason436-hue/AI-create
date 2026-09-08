import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const artifactRoot = process.env.KRT_E2E_ARTIFACT_DIR
  ? path.resolve(process.env.KRT_E2E_ARTIFACT_DIR)
  : process.platform === "win32"
    ? "D:\\.codex\\AI-create\\playwright"
    : path.resolve("test-results");

export default defineConfig({
  testDir: "./e2e",
  outputDir: path.join(artifactRoot, "results"),
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["line"],
    ["html", { outputFolder: path.join(artifactRoot, "report"), open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:3001",
    launchOptions: process.env.KRT_PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.KRT_PLAYWRIGHT_EXECUTABLE_PATH }
      : undefined,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.KRT_E2E_VIDEO === "1" ? "retain-on-failure" : "off",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "npm.cmd run test:e2e:serve",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      AI_GENERATION_ENABLED: "false",
    },
  },
});
