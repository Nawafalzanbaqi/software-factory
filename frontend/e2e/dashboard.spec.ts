import { createServer, type Server } from "node:http";
import { test, expect, type BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

/**
 * Client dashboard E2E (Phase 4) — MOCK MODE, runs in the ecommerce project
 * only (see playwright.config.ts: this file is matched by ecommerce-chromium
 * exclusively, so exactly one worker binds the stub port).
 *
 * What is real here: the Next server, the Auth.js session decode (the cookie
 * is minted with the SAME AUTH_SECRET + salt the server uses), the flag/role
 * guards, and the dashboard UI. What is mocked:
 * - the .NET backend — an in-process HTTP stub on port 5080 (the storefront's
 *   server components fetch it directly, so page.route cannot intercept);
 * - Payload REST — page.route (browser-side fetches from the catalog module).
 * The PATCH mock forwards the edit into the stub's product store, modelling
 * the CMS→catalog sync, so "owner edits → storefront reflects" is observable
 * end-to-end: /en/products re-renders from the stub with the new name.
 */

// One worker for the whole file: the stub backend owns port 5080 and the
// edit-flow test mutates its in-memory product store.
test.describe.configure({ mode: "serial" });

const AUTH_SECRET = process.env.AUTH_SECRET || "ci_dummy_secret_ci_dummy_secret_32";
const SESSION_COOKIE = "authjs.session-token";
const STUB_PORT = 5080;

/** Mutable product shared by the stub backend and the Payload REST mocks. */
const product = {
  id: "9a1f0000-0000-4000-8000-000000000001",
  slug: "classic-tee",
  nameEn: "Classic Tee",
  nameAr: "تي شيرت كلاسيكي",
  descriptionEn: "Soft cotton tee.",
  descriptionAr: "تي شيرت قطني ناعم.",
  price: 99,
  currency: "SAR",
  categoryId: "9a1f0000-0000-4000-8000-000000000002",
  images: [],
  inStock: true,
  tags: [],
};

function productDto() {
  return { ...product };
}

let stub: Server;

test.beforeAll(async () => {
  stub = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${STUB_PORT}`);
    const json = (body: unknown, status = 200) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };

    if (url.pathname === "/api/v1/products" && req.method === "GET") {
      return json({ items: [productDto()], page: 1, pageSize: 20, totalCount: 1, totalPages: 1 });
    }
    if (url.pathname === `/api/v1/products/${product.slug}` && req.method === "GET") {
      return json(productDto());
    }
    if (url.pathname === "/api/v1/categories" && req.method === "GET") {
      return json([]);
    }
    return json({ title: "not found" }, 404);
  });
  await new Promise<void>((resolve, reject) => {
    stub.once("error", reject);
    stub.listen(STUB_PORT, resolve);
  });
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => stub.close(() => resolve()));
});

/** Mint a real Auth.js session cookie (same secret + salt as the server). */
async function signInAs(
  context: BrowserContext,
  user: { sub: string; name: string; email: string; role?: string },
) {
  const value = await encode({
    token: {
      sub: user.sub,
      name: user.name,
      email: user.email,
      ...(user.role ? { role: user.role } : {}),
      payloadToken: "e2e-payload-token",
    },
    secret: AUTH_SECRET,
    salt: SESSION_COOKIE,
  });
  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax" as const,
    },
  ]);
}

/** Payload REST mocks for the catalog module (browser-side fetches). */
async function mockPayloadCatalog(page: import("@playwright/test").Page) {
  const payloadDoc = () => ({
    id: 1,
    slug: product.slug,
    name: { en: product.nameEn, ar: product.nameAr },
    price: product.price,
    inStock: product.inStock,
  });

  await page.route("**/api/products?*", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        docs: [payloadDoc()],
        totalDocs: 1,
        page: 1,
        totalPages: 1,
        limit: 20,
        hasNextPage: false,
        hasPrevPage: false,
      }),
    });
  });

  await page.route("**/api/products/1?*", (route) => {
    if (route.request().method() !== "PATCH") return route.fallback();
    const body = route.request().postDataJSON() as {
      name?: string;
      price?: number;
      inStock?: boolean;
    };
    const url = new URL(route.request().url());
    const locale = url.searchParams.get("locale");
    // The CMS→catalog sync the real stack does through shared data: apply the
    // edit to the stub backend's store so the storefront reflects it.
    if (locale === "ar") {
      if (body.name !== undefined) product.nameAr = body.name;
    } else {
      if (body.name !== undefined) product.nameEn = body.name;
      if (body.price !== undefined) product.price = body.price;
      if (body.inStock !== undefined) product.inStock = body.inStock;
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ doc: payloadDoc(), message: "Updated successfully." }),
    });
  });
}

test.describe("dashboard access gates", () => {
  test("guest hitting /dashboard is sent to sign-in with a callback", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/\/en\/sign-in\?callbackUrl=/);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("signed-in user WITHOUT a dashboard role gets the 403 screen", async ({
    page,
    context,
  }) => {
    await signInAs(context, {
      sub: "e2e-shopper",
      name: "E2E Shopper",
      email: "shopper@e2e.local",
      // no role
    });
    await page.goto("/en/dashboard");
    await expect(page.getByText("403")).toBeVisible();
    await expect(page.getByRole("heading", { name: /access denied/i })).toBeVisible();
  });

  test("staff can open the dashboard but see no Users module", async ({ page, context }) => {
    await signInAs(context, {
      sub: "e2e-staff",
      name: "E2E Staff",
      email: "staff@e2e.local",
      role: "staff",
    });
    await page.goto("/en/dashboard");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    const nav = page.getByRole("navigation", { name: /dashboard sections/i });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: /orders/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /users/i })).toHaveCount(0);

    // Owner-only route: staff get the 403 screen, not the users table.
    await page.goto("/en/dashboard/users");
    await expect(page.getByText("403")).toBeVisible();
  });
});

test.describe("owner edits a catalog item → storefront reflects it", () => {
  test("edit product name from the dashboard catalog", async ({ page, context }) => {
    await signInAs(context, {
      sub: "e2e-owner",
      name: "E2E Owner",
      email: "owner@e2e.local",
      role: "owner",
    });
    await mockPayloadCatalog(page);

    // The dashboard catalog lists the product (Payload REST, mocked).
    await page.goto("/en/dashboard/catalog");
    await expect(page.getByTestId("catalog-table")).toBeVisible();
    await expect(page.getByTestId("catalog-item-name")).toContainText("Classic Tee");

    // Edit: rename it.
    await page.getByTestId(`catalog-edit-${product.slug}`).click();
    const nameInput = page.getByTestId("catalog-name-en");
    await nameInput.fill("Premium Tee");
    await page.getByTestId("catalog-save").click();

    // The table refetches and shows the new name.
    await expect(page.getByTestId("catalog-item-name")).toContainText("Premium Tee");

    // The storefront (server-rendered from the stub backend) reflects it.
    await page.goto("/en/products");
    await expect(page.getByRole("main")).toContainText("Premium Tee");
  });
});
