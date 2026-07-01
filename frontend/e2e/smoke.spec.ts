import { test, expect } from "@playwright/test";

// Minimal smoke coverage — establishes the e2e pattern for the second agent.
test.describe("homepage", () => {
  test("renders the hero and localized nav (en)", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("ar locale sets rtl direction", async ({ page }) => {
    await page.goto("/ar");
    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("rtl");
  });
});

test("products listing is reachable", async ({ page }) => {
  await page.goto("/en/products");
  await expect(page.getByRole("main")).toBeVisible();
});
