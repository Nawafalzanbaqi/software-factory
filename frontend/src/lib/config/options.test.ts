import { describe, it, expect, beforeEach } from "vitest";
import {
  __resetOptionsCache,
  getEnabledSections,
  isFeatureEnabled,
  isSectionEnabled,
} from "./options";

// These read the real root options.json (or the bundled fallback) — asserting the
// loader wiring and ordering behavior rather than specific product data.
describe("options loader", () => {
  beforeEach(() => __resetOptionsCache());

  it("returns enabled sections sorted by order", async () => {
    const sections = await getEnabledSections();
    const orders = sections.map((s) => s.order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it("reflects feature flags", async () => {
    // reviews is disabled in the default manifest.
    expect(await isFeatureEnabled("reviews")).toBe(false);
    expect(await isSectionEnabled("hero")).toBe(true);
  });
});
