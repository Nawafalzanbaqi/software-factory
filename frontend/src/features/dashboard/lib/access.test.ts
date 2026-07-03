import { describe, it, expect } from "vitest";
import { decideDashboardAccess } from "./access";

/**
 * ROLE/FLAG GATE (unit) — the §6 contract for /dashboard, as a pure decision:
 * flag off => 404 (before auth, so the area is truly absent) · guest =>
 * sign-in · role-less or wrong-role session => 403 · staff blocked from
 * owner-only surfaces.
 */
describe("decideDashboardAccess", () => {
  const owner = { role: "owner" } as const;
  const staff = { role: "staff" } as const;
  const admin = { role: "admin" } as const;
  const customer = { role: undefined };

  it("returns not-found when the master flag is off — even for an owner session", () => {
    expect(
      decideDashboardAccess({ dashboardEnabled: false, user: owner }),
    ).toEqual({ kind: "not-found" });
  });

  it("returns not-found when the module flag is off — flag gating beats auth", () => {
    expect(
      decideDashboardAccess({ dashboardEnabled: true, moduleEnabled: false, user: owner }),
    ).toEqual({ kind: "not-found" });
    // Guests also see 404, not a sign-in prompt, for absent modules.
    expect(
      decideDashboardAccess({ dashboardEnabled: true, moduleEnabled: false, user: null }),
    ).toEqual({ kind: "not-found" });
  });

  it("redirects guests to sign-in when the area exists", () => {
    expect(decideDashboardAccess({ dashboardEnabled: true, user: null })).toEqual({
      kind: "sign-in",
    });
    expect(decideDashboardAccess({ dashboardEnabled: true, user: undefined })).toEqual({
      kind: "sign-in",
    });
  });

  it("forbids sessions without a dashboard role (403)", () => {
    expect(decideDashboardAccess({ dashboardEnabled: true, user: customer })).toEqual({
      kind: "forbidden",
    });
    expect(
      decideDashboardAccess({ dashboardEnabled: true, user: { role: "shopper" } }),
    ).toEqual({ kind: "forbidden" });
  });

  it("admits owner, staff and admin", () => {
    expect(decideDashboardAccess({ dashboardEnabled: true, user: owner })).toEqual({
      kind: "ok",
      role: "owner",
    });
    expect(decideDashboardAccess({ dashboardEnabled: true, user: staff })).toEqual({
      kind: "ok",
      role: "staff",
    });
    expect(decideDashboardAccess({ dashboardEnabled: true, user: admin })).toEqual({
      kind: "ok",
      role: "admin",
    });
  });

  it("forbids staff on owner-only surfaces; admits owner and admin", () => {
    expect(
      decideDashboardAccess({ dashboardEnabled: true, user: staff, ownerOnly: true }),
    ).toEqual({ kind: "forbidden" });
    expect(
      decideDashboardAccess({ dashboardEnabled: true, user: owner, ownerOnly: true }),
    ).toEqual({ kind: "ok", role: "owner" });
    expect(
      decideDashboardAccess({ dashboardEnabled: true, user: admin, ownerOnly: true }),
    ).toEqual({ kind: "ok", role: "admin" });
  });
});
