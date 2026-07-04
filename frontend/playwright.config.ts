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
 *
 * Phase 4 modes:
 * - dashboard.spec.ts (mock) joins the ecommerce run — CHROMIUM ONLY, because
 *   the spec binds an in-process stub backend on port 5080 and exactly one
 *   worker may own that port.
 * - REAL_BACKEND=1 switches to the `dashboard-real` project (its own CI job):
 *   docker-compose backend on :8080 + Payload sharing the compose postgres,
 *   so the dev server additionally needs DATABASE_URI + BACKEND_JWT_KEY
 *   (and NEXT_PUBLIC_API_BASE_URL=http://localhost:8080).
 */
const VERTICAL = (process.env.E2E_VERTICAL || "ecommerce") as "ecommerce" | "restaurant";
const REAL_BACKEND = process.env.REAL_BACKEND === "1";
const baseURL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const serverEnv: Record<string, string> = {
  // Fallbacks per mode: the mocked specs own an in-process stub on :5080;
  // real-backend mode talks to the compose backend published on :8080.
  NEXT_PUBLIC_API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (REAL_BACKEND ? "http://localhost:8080" : "http://localhost:5080"),
  AUTH_SECRET: process.env.AUTH_SECRET || "ci_dummy_secret_ci_dummy_secret_32",
  PAYLOAD_SECRET:
    process.env.PAYLOAD_SECRET || "ci_dummy_payload_secret_value_here",
  // Restaurant vertical: point the loader at the restaurant manifest (resolved
  // relative to the repo root from the frontend/ cwd) for BOTH build and start.
  ...(VERTICAL === "restaurant" ? { OPTIONS_FILE: "options.restaurant.json" } : {}),
  // Real-backend mode: Payload needs the compose postgres; the manage-orders
  // bearer must be signed with the same key the backend validates (Jwt:Key).
  ...(REAL_BACKEND && process.env.DATABASE_URI
    ? { DATABASE_URI: process.env.DATABASE_URI }
    : {}),
  ...(REAL_BACKEND && process.env.BACKEND_JWT_KEY
    ? { BACKEND_JWT_KEY: process.env.BACKEND_JWT_KEY }
    : {}),
};

const ecommerceProjects = [
  {
    name: "ecommerce-chromium",
    testMatch: /smoke\.spec\.ts|dashboard\.spec\.ts/,
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

const realBackendProjects = [
  {
    name: "dashboard-real",
    testMatch: /dashboard-real\.spec\.ts/,
    use: { ...devices["Desktop Chrome"], baseURL },
    // The DEV server compiles each route on first hit; on a CI runner those
    // first-compiles regularly exceed the default 5s expect timeout.
    expect: { timeout: 30_000 },
    timeout: 180_000,
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
  projects: REAL_BACKEND
    ? realBackendProjects
    : VERTICAL === "restaurant"
      ? restaurantProjects
      : ecommerceProjects,
  webServer: {
    // Dev server: no prior production build needed (the frontend job covers build).
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: serverEnv,
  },
});
