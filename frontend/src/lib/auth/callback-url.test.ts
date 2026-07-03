import { describe, it, expect } from "vitest";
import { safeCallbackUrl } from "./callback-url";

/**
 * OPEN-REDIRECT GUARD (unit) — security audit fix #5. The guard must admit
 * only same-site relative paths, structurally validated, with backslashes
 * rejected (browsers normalize "\" to "/", so "/\evil.com" ⇒ //evil.com).
 */
describe("safeCallbackUrl", () => {
  it("admits rooted relative paths (with query/hash) unchanged", () => {
    expect(safeCallbackUrl("/dashboard")).toBe("/dashboard");
    expect(safeCallbackUrl("/dashboard/orders?page=2#row-3")).toBe(
      "/dashboard/orders?page=2#row-3",
    );
    expect(safeCallbackUrl(["/dashboard/users", "/ignored"])).toBe("/dashboard/users");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeCallbackUrl("https://evil.example")).toBeUndefined();
    expect(safeCallbackUrl("http://evil.example/x")).toBeUndefined();
    expect(safeCallbackUrl("//evil.example")).toBeUndefined();
    expect(safeCallbackUrl("javascript:alert(1)")).toBeUndefined();
  });

  it("rejects backslash smuggling (browser treats \\ as /)", () => {
    expect(safeCallbackUrl("/\\evil.example")).toBeUndefined();
    expect(safeCallbackUrl("\\/evil.example")).toBeUndefined();
    expect(safeCallbackUrl("\\\\evil.example")).toBeUndefined();
    expect(safeCallbackUrl("/dashboard\\..\\x")).toBeUndefined();
  });

  it("rejects empty, missing and non-rooted values", () => {
    expect(safeCallbackUrl(undefined)).toBeUndefined();
    expect(safeCallbackUrl("")).toBeUndefined();
    expect(safeCallbackUrl("dashboard")).toBeUndefined();
    expect(safeCallbackUrl("../dashboard")).toBeUndefined();
  });

  it("returns the PARSED navigation target, not the raw input", () => {
    expect(safeCallbackUrl("/a/../dashboard")).toBe("/dashboard");
    expect(safeCallbackUrl("/./dashboard")).toBe("/dashboard");
  });

  it("rejects traversal that normalizes into a protocol-relative path", () => {
    // new URL("/..//dashboard").pathname === "//dashboard" — same origin per
    // the parser, but protocol-relative if handed back to a router.
    expect(safeCallbackUrl("/..//dashboard")).toBeUndefined();
  });
});
