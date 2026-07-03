import { describe, it, expect, afterEach } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Users } from "./collections/Users";
import { SiteSettings } from "./globals/SiteSettings";
import { __resetManifestFlagsCache } from "./manifest-flags";

/**
 * PAYLOAD REST GATING (unit) — security audit fixes #3 + #4, proven against
 * the REAL access functions wired into the Users collection and SiteSettings
 * global (not re-implementations), booted per manifest variant like
 * features/dashboard/lib/nav.test.ts:
 * - flag(s) off ⇒ /api/users and /api/globals/siteSettings are DENIED to
 *   owner/staff (create/read/update/delete resolve to false);
 * - the factory-operator `admin` path is never gated;
 * - staff can NEVER update siteSettings (owner-scoped role model, fix #4),
 *   flags on or off.
 */

type AccessFn = (args: { req: { user: unknown } }) => unknown;
interface AccessMap {
  read: AccessFn;
  create: AccessFn;
  update: AccessFn;
  delete: AccessFn;
}

const usersAccess = Users.access as unknown as AccessMap;
const settingsAccess = SiteSettings.access as unknown as Pick<AccessMap, "read" | "update">;
const roleField = Users.fields.find((f) => "name" in f && f.name === "role");
const roleFieldAccess = (roleField && "access" in roleField
  ? roleField.access
  : undefined) as unknown as Pick<AccessMap, "create" | "update">;

const asUser = (role?: string, id: string | number = 7) => ({
  req: { user: role ? { id, role } : null },
});

const savedOptionsFile = process.env.OPTIONS_FILE;
const tempDirs: string[] = [];

/** Boot the manifest readers on a variant of options.ecommerce.json. */
function bootWithFeatures(overrides: Record<string, boolean>): void {
  const repoRoot = path.resolve(process.cwd(), "..");
  const manifest = JSON.parse(
    readFileSync(path.join(repoRoot, "options.ecommerce.json"), "utf-8"),
  ) as { features: Record<string, boolean> };
  manifest.features = { ...manifest.features, ...overrides };
  const dir = mkdtempSync(path.join(tmpdir(), "sf-rest-gate-test-"));
  tempDirs.push(dir);
  const file = path.join(dir, "options.json");
  writeFileSync(file, JSON.stringify(manifest));
  process.env.OPTIONS_FILE = file;
  __resetManifestFlagsCache();
}

afterEach(() => {
  if (savedOptionsFile === undefined) delete process.env.OPTIONS_FILE;
  else process.env.OPTIONS_FILE = savedOptionsFile;
  __resetManifestFlagsCache();
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("flags ON (shipped manifest): phase-4 behavior unchanged", () => {
  it("owner manages non-admin users; staff read self; owner updates settings", () => {
    bootWithFeatures({});
    expect(usersAccess.read(asUser("owner"))).toEqual({ role: { not_equals: "admin" } });
    expect(usersAccess.create(asUser("owner"))).toBe(true);
    expect(usersAccess.read(asUser("staff", 3))).toEqual({ id: { equals: 3 } });
    expect(settingsAccess.update(asUser("owner"))).toBe(true);
  });

  it("staff can NEVER update siteSettings (owner-scoped role model, fix #4)", () => {
    bootWithFeatures({});
    expect(settingsAccess.update(asUser("staff"))).toBe(false);
  });
});

describe("clientDashboard=false: the Payload REST surface is absent for owner/staff", () => {
  it("denies owner and staff every users operation", () => {
    bootWithFeatures({ clientDashboard: false });
    for (const role of ["owner", "staff"]) {
      expect(usersAccess.read(asUser(role))).toBe(false);
      expect(usersAccess.create(asUser(role))).toBe(false);
      expect(usersAccess.update(asUser(role))).toBe(false);
      expect(usersAccess.delete(asUser(role))).toBe(false);
      expect(roleFieldAccess.update(asUser(role))).toBe(false);
    }
  });

  it("denies owner (and staff) siteSettings updates; public read stays open", () => {
    bootWithFeatures({ clientDashboard: false });
    expect(settingsAccess.update(asUser("owner"))).toBe(false);
    expect(settingsAccess.update(asUser("staff"))).toBe(false);
    // Site chrome stays publicly readable — it is content, not a module surface.
    expect(settingsAccess.read(asUser(undefined))).toBe(true);
  });

  it("keeps the factory-operator admin path open", () => {
    bootWithFeatures({ clientDashboard: false });
    expect(usersAccess.read(asUser("admin"))).toBe(true);
    expect(usersAccess.create(asUser("admin"))).toBe(true);
    expect(usersAccess.delete(asUser("admin"))).toBe(true);
    expect(roleFieldAccess.update(asUser("admin"))).toBe(true);
    expect(settingsAccess.update(asUser("admin"))).toBe(true);
  });
});

describe("per-module flags: each gate is independent (master flag on)", () => {
  it("dashboardUsers=false denies owner/staff users access; settings unaffected", () => {
    bootWithFeatures({ dashboardUsers: false });
    expect(usersAccess.read(asUser("owner"))).toBe(false);
    expect(usersAccess.read(asUser("staff"))).toBe(false);
    expect(usersAccess.create(asUser("owner"))).toBe(false);
    expect(settingsAccess.update(asUser("owner"))).toBe(true);
    expect(usersAccess.read(asUser("admin"))).toBe(true);
  });

  it("dashboardSettings=false denies owner settings updates; users unaffected", () => {
    bootWithFeatures({ dashboardSettings: false });
    expect(settingsAccess.update(asUser("owner"))).toBe(false);
    expect(usersAccess.read(asUser("owner"))).toEqual({ role: { not_equals: "admin" } });
    expect(settingsAccess.update(asUser("admin"))).toBe(true);
  });
});

describe("unauthenticated callers", () => {
  it("get nothing from either surface regardless of flags", () => {
    bootWithFeatures({});
    expect(usersAccess.read(asUser(undefined))).toBe(false);
    expect(usersAccess.create(asUser(undefined))).toBe(false);
    expect(settingsAccess.update(asUser(undefined))).toBe(false);
  });
});

describe("no readable manifest: the gate FAILS CLOSED (adversarial-review finding)", () => {
  it("denies owner/staff (admin path stays open) when every candidate is unreadable", () => {
    // From an isolated temp cwd, neither ../options.json nor ./options.json
    // resolves, OPTIONS_FILE/OPTIONS_MANIFEST_PATH are unset — the gate must
    // treat "no manifest" as "no flags", NOT as the bundled all-on default.
    // chdir into a NESTED dir so the "../options.json" candidate also lands
    // inside a directory this test owns (never the shared system temp root).
    const dir = mkdtempSync(path.join(tmpdir(), "sf-no-manifest-"));
    tempDirs.push(dir);
    const inner = path.join(dir, "cwd");
    mkdirSync(inner);
    const savedCwd = process.cwd();
    const savedManifestPath = process.env.OPTIONS_MANIFEST_PATH;
    delete process.env.OPTIONS_FILE;
    delete process.env.OPTIONS_MANIFEST_PATH;
    try {
      process.chdir(inner);
      __resetManifestFlagsCache();
      expect(usersAccess.read(asUser("owner"))).toBe(false);
      expect(settingsAccess.update(asUser("owner"))).toBe(false);
      expect(usersAccess.read(asUser("staff"))).toBe(false);
      expect(usersAccess.read(asUser("admin"))).toBe(true);
      expect(settingsAccess.update(asUser("admin"))).toBe(true);
    } finally {
      process.chdir(savedCwd);
      if (savedManifestPath !== undefined) process.env.OPTIONS_MANIFEST_PATH = savedManifestPath;
      __resetManifestFlagsCache();
    }
  });
});
