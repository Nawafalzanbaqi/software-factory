import { test, expect } from "@playwright/test";

/**
 * Client dashboard E2E (Phase 4) — REAL BACKEND MODE. Runs only in the
 * `dashboard-real` Playwright project (REAL_BACKEND=1; its own CI job) against
 * the docker-compose stack: postgres + redis + the .NET backend on :8080,
 * with Payload sharing the same postgres (DATABASE_URI) and `npm run
 * payload:seed` having provisioned the admin/owner users.
 *
 * NOTHING here is mocked: sign-in goes through Auth.js -> payload.login,
 * the order is created through the real cart/checkout endpoints, the list +
 * detail render from GET /api/v1/manage/orders*, and the status transition
 * exercises POST /api/v1/manage/orders/{n}/status with the minted staff JWT.
 */

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const OWNER_EMAIL = process.env.DASHBOARD_OWNER_EMAIL || "owner@softwarefactory.local";
// No fallback (audit fix #2: no repo-known credential anywhere): the same env
// var must have been set for `npm run payload:seed`, or the owner account
// doesn't exist and this suite cannot run.
const OWNER_PASSWORD = process.env.DASHBOARD_OWNER_PASSWORD || "";

test.beforeAll(() => {
  if (!OWNER_PASSWORD) {
    throw new Error(
      "DASHBOARD_OWNER_PASSWORD is not set — export the value used when seeding " +
        "(npm run payload:seed) before running the dashboard-real suite.",
    );
  }
});

/**
 * Warm up Payload inside the Next dev server before the UI sign-in: the first
 * Payload use initializes the ORM (dev push) and can exceed the form's
 * patience, which would fail the first authorize() attempt.
 */
test.beforeAll(async ({ request }) => {
  const deadline = Date.now() + 120_000;
  for (;;) {
    try {
      const res = await request.post("/api/users/login", {
        data: { email: OWNER_EMAIL, password: OWNER_PASSWORD },
        timeout: 30_000,
      });
      if (res.ok()) return;
    } catch {
      // dev server / Payload still compiling — retry below.
    }
    if (Date.now() > deadline) {
      throw new Error("Payload login warmup never succeeded — check payload:seed + DATABASE_URI");
    }
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }
});

/** Create a real order through the public API: add to cart -> checkout. */
async function placeOrder(request: import("@playwright/test").APIRequestContext) {
  const products = await request.get(`${API}/api/v1/products?pageSize=1`);
  expect(products.ok(), "backend must be seeded with products").toBeTruthy();
  const productsBody = (await products.json()) as { items: { id: string }[] };
  expect(productsBody.items.length).toBeGreaterThan(0);

  const cartRes = await request.post(`${API}/api/v1/cart/items`, {
    data: { productId: productsBody.items[0].id, quantity: 1 },
  });
  expect(cartRes.ok()).toBeTruthy();
  const cart = (await cartRes.json()) as { id: string };

  const checkoutRes = await request.post(`${API}/api/v1/checkout`, {
    data: {
      cartId: cart.id,
      customer: { name: "E2E Customer", email: "customer@e2e.local", phone: "+966500000000" },
      shippingAddress: "1 Test Street, Riyadh",
      paymentMethod: "cod",
    },
  });
  expect(checkoutRes.ok()).toBeTruthy();
  const order = (await checkoutRes.json()) as { orderNumber: string };
  expect(order.orderNumber).toBeTruthy();
  return order.orderNumber;
}

test("owner signs in, finds the order, opens it and advances its status", async ({
  page,
  request,
}) => {
  const orderNumber = await placeOrder(request);

  // Sign in through the real form (Auth.js Credentials -> payload.login).
  await page.goto("/en/sign-in");
  await page.getByLabel(/email/i).fill(OWNER_EMAIL);
  await page.getByLabel(/password/i).fill(OWNER_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/);

  // Orders list shows the order we just placed.
  await page.goto("/en/dashboard/orders");
  await expect(page.getByRole("heading", { name: /orders/i }).first()).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: orderNumber });
  await expect(row).toBeVisible();

  // Open the detail: items, customer and timeline come from the manage API.
  await row.getByRole("link", { name: /view/i }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/orders/${orderNumber}`));
  await expect(page.getByRole("heading", { name: new RegExp(orderNumber) })).toBeVisible();
  await expect(page.getByText("customer@e2e.local")).toBeVisible();

  // Transition Pending -> Processing through the server action.
  await page.getByLabel(/new status/i).selectOption("Processing");
  await page.getByRole("button", { name: /^update$/i }).click();

  // The re-rendered detail shows the new status in the timeline
  // (OrderTimeline's <ol> aria-label = orders.timelineLabel).
  await expect(
    page.getByRole("list", { name: /order status history|سجل حالات الطلب/i }),
  ).toContainText(/processing/i);
});
