import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { __resetOptionsCache } from "@/lib/config/options";
import { getDashboardNav } from "./nav";

/**
 * DASHBOARD NAV GATING (unit) — boots the real options loader per manifest
 * (same pattern as lib/config/vertical.test.ts) and asserts the nav derives
 * ONLY from enabled flags + role:
 * - both shipped manifests expose every module (owner) and hide users (staff);
 * - clientDashboard=false yields an EMPTY nav;
 * - a single module flag off removes exactly that item.
 * Keep expectations in lock-step with scripts/verify-verticals.mjs.
 */
const savedOptionsFile = process.env.OPTIONS_FILE;
const tempDirs: string[] = [];

function bootAs(file: string) {
  process.env.OPTIONS_FILE = file;
  __resetOptionsCache();
}

/** Write a variant of options.ecommerce.json with feature overrides. */
function bootWithFeatures(overrides: Record<string, boolean>): void {
  const repoRoot = path.resolve(process.cwd(), "..");
  const manifest = JSON.parse(
    readFileSync(path.join(repoRoot, "options.ecommerce.json"), "utf-8"),
  ) as { features: Record<string, boolean> };
  manifest.features = { ...manifest.features, ...overrides };
  const dir = mkdtempSync(path.join(tmpdir(), "sf-nav-test-"));
  tempDirs.push(dir);
  const file = path.join(dir, "options.json");
  writeFileSync(file, JSON.stringify(manifest));
  bootAs(file); // absolute path — supported by getCandidatePaths
}

afterEach(() => {
  if (savedOptionsFile === undefined) delete process.env.OPTIONS_FILE;
  else process.env.OPTIONS_FILE = savedOptionsFile;
  __resetOptionsCache();
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("getDashboardNav", () => {
  it.each(["options.ecommerce.json", "options.restaurant.json"])(
    "%s: owner sees every enabled module",
    async (file) => {
      bootAs(file);
      const hrefs = (await getDashboardNav("owner")).map((i) => i.href);
      expect(hrefs).toEqual([
        "/dashboard",
        "/dashboard/orders",
        "/dashboard/catalog",
        "/dashboard/content",
        "/dashboard/users",
        "/dashboard/settings",
      ]);
    },
  );

  it("staff never see the owner-only users module", async () => {
    bootAs("options.ecommerce.json");
    const hrefs = (await getDashboardNav("staff")).map((i) => i.href);
    expect(hrefs).not.toContain("/dashboard/users");
    expect(hrefs).toContain("/dashboard/orders");
  });

  it("clientDashboard=false yields an empty nav (dashboard absent)", async () => {
    bootWithFeatures({ clientDashboard: false });
    expect(await getDashboardNav("owner")).toEqual([]);
  });

  it("a disabled module flag removes exactly that item", async () => {
    bootWithFeatures({ dashboardOrders: false });
    const hrefs = (await getDashboardNav("owner")).map((i) => i.href);
    expect(hrefs).not.toContain("/dashboard/orders");
    expect(hrefs).toContain("/dashboard/catalog");
  });

  it("content module requires cms too", async () => {
    bootWithFeatures({ cms: false });
    const hrefs = (await getDashboardNav("owner")).map((i) => i.href);
    expect(hrefs).not.toContain("/dashboard/content");
  });
});
