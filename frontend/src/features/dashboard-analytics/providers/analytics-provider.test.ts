import { describe, it, expect } from "vitest";
import { NoOpAnalyticsProvider, getAnalyticsProvider } from "./analytics-provider";

/**
 * NOOP RULE (§9) — the analytics seam must work with ZERO keys set: the NoOp
 * provider returns a deterministic, honest (connected:false) empty summary and
 * is the default provider.
 */
describe("NoOpAnalyticsProvider", () => {
  it("returns an empty, not-connected summary without any env", async () => {
    const summary = await new NoOpAnalyticsProvider().getSummary(30);
    expect(summary.connected).toBe(false);
    expect(summary.visitors).toBe(0);
    expect(summary.pageviews).toBe(0);
    expect(summary.topPages).toEqual([]);
    expect(summary.sources).toEqual([]);
    expect(new Date(summary.from).getTime()).toBeLessThan(new Date(summary.to).getTime());
  });

  it("is the default provider (real providers are a one-line swap)", () => {
    expect(getAnalyticsProvider()).toBeInstanceOf(NoOpAnalyticsProvider);
  });
});
