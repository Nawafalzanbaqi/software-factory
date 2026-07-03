import { describe, it, expect } from "vitest";
import { validateRoleValue } from "./Users";

/**
 * PRIVILEGE RULES (unit) — the pure core of the Users collection's role field
 * `validate`:
 * - trusted server-side writes (overrideAccess: seed / Local API) bypass;
 * - only an admin may hand out the admin role;
 * - nobody may change their OWN role (owner self-demotion lockout guard).
 */
describe("validateRoleValue", () => {
  it("blocks owners and staff from assigning admin", () => {
    expect(validateRoleValue("admin", { requesterRole: "owner" })).toMatch(/only an admin/i);
    expect(validateRoleValue("admin", { requesterRole: "staff" })).toMatch(/only an admin/i);
    expect(validateRoleValue("admin", {})).toMatch(/only an admin/i);
  });

  it("lets an admin assign admin", () => {
    expect(validateRoleValue("admin", { requesterRole: "admin" })).toBe(true);
  });

  it("lets owners assign owner/staff to OTHER users", () => {
    expect(
      validateRoleValue("owner", { requesterRole: "owner", requesterId: 1, targetId: 2 }),
    ).toBe(true);
    expect(
      validateRoleValue("staff", { requesterRole: "owner", requesterId: 1, targetId: 2 }),
    ).toBe(true);
  });

  it("blocks changing one's own role (self-demotion lockout)", () => {
    expect(
      validateRoleValue("staff", { requesterRole: "owner", requesterId: 7, targetId: 7 }),
    ).toMatch(/own role/i);
    // Re-saving the unchanged role is fine (admin panel profile saves).
    expect(
      validateRoleValue("owner", { requesterRole: "owner", requesterId: 7, targetId: 7 }),
    ).toBe(true);
  });

  it("bypasses for trusted server-side writes (seed bootstrap)", () => {
    // The seed creates the first admin with NO authenticated requester.
    expect(validateRoleValue("admin", { overrideAccess: true })).toBe(true);
    expect(
      validateRoleValue("staff", {
        overrideAccess: true,
        requesterRole: "owner",
        requesterId: 7,
        targetId: 7,
      }),
    ).toBe(true);
  });
});
