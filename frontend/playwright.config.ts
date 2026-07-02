import { defineConfig, devices } from "@playwright/test";

/**
 * Dual-vertical E2E. Each vertical boots its OWN production server (Next bakes the
 * active options file at build time, so a vertical == a build+start pair):
 *   - ecommerce  -> port 3000, default options.json    -> e2e/smoke.spec.ts
 *   - restaurant -> port 3100, options.restaurant.json -> e2e/restaurant.spec.ts
 *
 * CI runs the frontend WITHOUT a backend; the restaurant spec mocks /api/v1/* with
 * page.route so its flow is deterministic. Keeping a project-per-vertical lets the
 * existing ecommerce smoke test keep working unchanged.
 */
const ECOM_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const RESTAURANT_PORT = process.env.RESTAURANT_PORT || "3100";
const RESTAURANT_URL = `http://localhost:${RESTAURANT_PORT}`;

const buildEnv = {
  NEXT_PUBLIC_API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5080",
  AUTH_SECRET: process.env.AUTH_SECRET || "ci_dummy_secret_ci_dummy_secret_32",
  PAYLOAD_SECRET:
    process.env.PAYLOAD_SECRET || "ci_dummy_payload_secret_value_here",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    // --- ecommerce (default build) --------------------------------------
    {
      name: "ecommerce-chromium",
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: ECOM_URL },
    },
    {
      name: "ecommerce-mobile",
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices["Pixel 5"], baseURL: ECOM_URL },
    },
    // --- restaurant (options.restaurant.json build) ---------------------
    {
      name: "restaurant-chromium",
      testMatch: /restaurant\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: RESTAURANT_URL },
    },
  ],
  webServer: [
    {
      // Ecommerce: assumes a prior `npm run build` (default options.json).
      command: "npm run start",
      url: ECOM_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Restaurant: dedicated build+start with the restaurant options file.
      command: `OPTIONS_FILE=../options.restaurant.json npm run build && OPTIONS_FILE=../options.restaurant.json PORT=${RESTAURANT_PORT} npm run start`,
      url: RESTAURANT_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: buildEnv,
    },
  ],
});
