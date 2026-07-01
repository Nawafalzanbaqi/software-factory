import { describe, it, expect } from "vitest";
import { cn, formatPrice } from "./utils";

describe("cn", () => {
  it("merges and de-dupes conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold",
    );
  });
});

describe("formatPrice", () => {
  it("formats a price with currency for en", () => {
    const out = formatPrice(199.5, "SAR", "en");
    expect(out).toContain("199");
  });

  it("does not throw for an unusual currency", () => {
    expect(() => formatPrice(10, "XYZ", "en")).not.toThrow();
  });
});
