import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.DASHBOARD_URL || "http://localhost:3000";

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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Dev server so E2E needs no prior production build. The Platform API is
    // mocked with page.route in the specs, so no backend is required.
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-32c",
      AUTH_TRUST_HOST: "true",
      ADMIN_EMAIL: "admin@softwarefactory.local",
      ADMIN_PASSWORD: "e2e-password",
      PLATFORM_API_BASE_URL: "http://localhost:5090",
      CI_WEBHOOK_SECRET: "e2e-ci-secret",
    },
  },
});
