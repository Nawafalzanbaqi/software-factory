import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  __resetOptionsCache,
  getSiteType,
  getEnabledSections,
  isSectionEnabled,
  isFeatureEnabled,
} from "./options";

/**
 * VERTICAL PROOF (unit) — boots the options loader twice, once per variant, by
 * pointing OPTIONS_FILE at each root manifest (resolved relative to the repo root,
 * i.e. frontend/.. — see options.ts getCandidatePaths). Asserts that getSiteType +
 * getEnabledSections diverge correctly between ecommerce and restaurant, and that a
 * disabled section (reviews) is absent in BOTH. Deterministic: reads static JSON,
 * resets the per-process cache between boots, restores env after.
 */
const savedOptionsFile = process.env.OPTIONS_FILE;

function bootAs(file: string) {
  process.env.OPTIONS_FILE = file;
  __resetOptionsCache();
}

afterEach(() => {
  if (savedOptionsFile === undefined) delete process.env.OPTIONS_FILE;
  else process.env.OPTIONS_FILE = savedOptionsFile;
  __resetOptionsCache();
});

describe("vertical: ecommerce boot", () => {
  beforeEach(() => bootAs("options.ecommerce.json"));

  it("selects the ecommerce siteType", async () => {
    expect(await getSiteType()).toBe("ecommerce");
  });

  it("enables ecommerce sections and NOT restaurant sections", async () => {
    const names = (await getEnabledSections()).map((s) => s.name);
    expect(names).toContain("productListing");
    expect(names).toContain("categories");
    expect(names).not.toContain("menu");
    expect(names).not.toContain("branches");
    expect(names).not.toContain("reservation");
  });

  it("keeps the disabled 'reviews' section absent", async () => {
    expect(await isSectionEnabled("reviews")).toBe(false);
    const names = (await getEnabledSections()).map((s) => s.name);
    expect(names).not.toContain("reviews");
  });
});

describe("vertical: restaurant boot", () => {
  beforeEach(() => bootAs("options.restaurant.json"));

  it("selects the restaurant siteType", async () => {
    expect(await getSiteType()).toBe("restaurant");
  });

  it("enables restaurant sections and NOT ecommerce sections", async () => {
    const names = (await getEnabledSections()).map((s) => s.name);
    expect(names).toContain("menu");
    expect(names).toContain("branches");
    expect(names).toContain("reservation");
    expect(names).toContain("gallery");
    expect(names).toContain("promotions");
    expect(names).not.toContain("productListing");
    expect(names).not.toContain("categories");
  });

  it("enables restaurant feature flags (reservations/branchLocator/gallery)", async () => {
    expect(await isFeatureEnabled("reservations")).toBe(true);
    expect(await isFeatureEnabled("branchLocator")).toBe(true);
    expect(await isFeatureEnabled("gallery")).toBe(true);
    // wishlist is an ecommerce-only concept — off for the restaurant.
    expect(await isFeatureEnabled("wishlist")).toBe(false);
  });

  it("keeps the disabled 'reviews' section absent", async () => {
    expect(await isSectionEnabled("reviews")).toBe(false);
    const names = (await getEnabledSections()).map((s) => s.name);
    expect(names).not.toContain("reviews");
  });
});

describe("vertical: sections stay sorted by order per boot", () => {
  it("ecommerce sections are ascending by order", async () => {
    bootAs("options.ecommerce.json");
    const orders = (await getEnabledSections()).map((s) => s.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("restaurant sections are ascending by order", async () => {
    bootAs("options.restaurant.json");
    const orders = (await getEnabledSections()).map((s) => s.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
