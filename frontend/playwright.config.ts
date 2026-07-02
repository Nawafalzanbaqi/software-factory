import { defineConfig, devices } from "@playwright/test";

/**
 * Dual-vertical E2E. Two `next` servers can't share one `.next` dir, so we run
 * ONE vertical per invocation, selected by `E2E_VERTICAL` (default "ecommerce").
 * CI runs the job twice: ecommerce, then `E2E_VERTICAL=restaurant`.
 *
 * The DEV server is used so no prior production build is required (avoids the
 * "Could not find a production build in '.next'" CI failure; the `frontend` job
 * already covers `next build`). Wrong-vertical route guards are asserted by
 * CONTENT (the not-found UI), since a child `notFound()` under the root layout
 * keeps a 200 status in both dev and prod. The restaurant spec mocks /api/v1/*
 * via page.route so the flow is deterministic without a backend.
 */
const VERTICAL = (process.env.E2E_VERTICAL || "ecommerce") as "ecommerce" | "restaurant";
const baseURL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const serverEnv: Record<string, string> = {
  NEXT_PUBLIC_API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5080",
  AUTH_SECRET: process.env.AUTH_SECRET || "ci_dummy_secret_ci_dummy_secret_32",
  PAYLOAD_SECRET:
    process.env.PAYLOAD_SECRET || "ci_dummy_payload_secret_value_here",
  // Restaurant vertical: point the loader at the restaurant manifest (resolved
  // relative to the repo root from the frontend/ cwd) for BOTH build and start.
  ...(VERTICAL === "restaurant" ? { OPTIONS_FILE: "options.restaurant.json" } : {}),
};

const ecommerceProjects = [
  {
    name: "ecommerce-chromium",
    testMatch: /smoke\.spec\.ts/,
    use: { ...devices["Desktop Chrome"], baseURL },
  },
  {
    name: "ecommerce-mobile",
    testMatch: /smoke\.spec\.ts/,
    use: { ...devices["Pixel 5"], baseURL },
  },
];

const restaurantProjects = [
  {
    name: "restaurant-chromium",
    testMatch: /restaurant\.spec\.ts/,
    use: { ...devices["Desktop Chrome"], baseURL },
  },
];

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
  projects: VERTICAL === "restaurant" ? restaurantProjects : ecommerceProjects,
  webServer: {
    // Dev server: no prior production build needed (the frontend job covers build).
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: serverEnv,
  },
});
