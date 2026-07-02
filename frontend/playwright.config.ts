import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    // Use the dev server so E2E needs no prior production build (the `frontend`
    // CI job already covers `next build`). Avoids the "Could not find a production
    // build in '.next'" failure when `next start` runs without a build in CI.
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
