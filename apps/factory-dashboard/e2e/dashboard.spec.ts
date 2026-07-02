import { test, expect } from "@playwright/test";
import { createServer, type Server, type ServerResponse } from "node:http";

/**
 * E2E: sign in -> open a project -> approve a gate -> see it reflected.
 *
 * The dashboard talks to the Platform API from the SERVER (Server Components +
 * server actions), so Playwright's `page.route` — which only intercepts the
 * BROWSER's requests — cannot mock those Node-side fetches. Instead we stand up
 * a tiny in-process mock Platform API on the same port the dev server points at
 * (PLATFORM_API_BASE_URL=http://localhost:5090). This keeps the test fully
 * deterministic with no live backend, exactly as intended. Mutable state lets an
 * approval POST be reflected by the next GET (mirrors optimistic reflect).
 *
 * `page.route` is still used to assert no stray browser->Platform calls leak.
 */

const PROJECT_ID = "11111111-1111-1111-1111-111111111111";
const CLIENT_ID = "22222222-2222-2222-2222-222222222222";
const PORT = 5090;

interface Gate {
  id: string;
  projectId: string;
  gateType: "Architecture" | "Security" | "Deploy";
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string | null;
  isApproved: boolean;
}

let server: Server;
let gates: Gate[];

function makeGates(): Gate[] {
  return (["Architecture", "Security", "Deploy"] as const).map((gateType, i) => ({
    id: `gate-${i}`,
    projectId: PROJECT_ID,
    gateType,
    approvedBy: null,
    approvedAt: null,
    notes: null,
    isApproved: false,
  }));
}

const project = {
  id: PROJECT_ID,
  clientId: CLIENT_ID,
  name: "Acme Storefront",
  siteType: "ecommerce",
  currentPhase: "Build" as const,
  repoUrl: "https://example.com/acme/repo",
  branch: "main",
  liveUrl: null,
  createdAt: "2026-06-01T10:00:00.000Z",
};

const clients = [
  {
    id: CLIENT_ID,
    name: "Acme Inc",
    contactEmail: "ops@acme.test",
    notes: null,
    createdAt: "2026-05-01T10:00:00.000Z",
  },
];

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

test.beforeAll(async () => {
  gates = makeGates();
  server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    const { pathname } = url;
    const method = req.method ?? "GET";

    if (method === "GET" && pathname === "/api/clients") {
      return json(res, 200, clients);
    }
    if (method === "GET" && pathname === "/api/projects") {
      return json(res, 200, [project]);
    }
    if (method === "GET" && pathname === `/api/projects/${PROJECT_ID}`) {
      // Nested shape, matching the real Platform API ProjectDetailDto.
      return json(res, 200, {
        project,
        gates,
        usage: { records: [], totalCostUsd: 1.2345, totalTokens: 123456 },
        recentDeployments: [],
      });
    }
    if (method === "GET" && pathname === `/api/projects/${PROJECT_ID}/usage`) {
      return json(res, 200, {
        records: [
          {
            id: "u1",
            projectId: PROJECT_ID,
            model: "claude-opus-4",
            tokens: 123456,
            costUsd: 1.2345,
            recordedAt: "2026-06-02T12:00:00.000Z",
          },
        ],
        totalCostUsd: 1.2345,
        totalTokens: 123456,
      });
    }
    if (method === "GET" && pathname === `/api/analytics/${PROJECT_ID}`) {
      return json(res, 200, {
        projectId: PROJECT_ID,
        provider: "noop",
        visitors: 0,
        pageViews: 0,
        bounceRate: 0,
        timeseries: [],
      });
    }
    if (method === "POST" && pathname === `/api/projects/${PROJECT_ID}/approvals`) {
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => {
        const body = JSON.parse(raw || "{}") as { gateType: string; approvedBy: string };
        const gate = gates.find((g) => g.gateType === body.gateType);
        if (gate) {
          gate.isApproved = true;
          gate.approvedBy = body.approvedBy;
          gate.approvedAt = new Date().toISOString();
        }
        json(res, 200, gate);
      });
      return;
    }

    json(res, 404, { error: "not found", pathname });
  });

  await new Promise<void>((resolve) => server.listen(PORT, resolve));
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

test("admin signs in, opens a project, approves a gate, and sees it reflected", async ({
  page,
}) => {
  // Guard: no browser-side calls should ever leak to the Platform API.
  await page.route("**/localhost:5090/**", (route) => route.abort());

  // 1. Sign in (credentials checked against ADMIN_EMAIL/ADMIN_PASSWORD env).
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("admin@softwarefactory.local");
  await page.getByLabel("Password").fill("e2e-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Redirects to /projects after auth.
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("link", { name: "Acme Storefront" })).toBeVisible();

  // 2. Open the project detail.
  await page.getByRole("link", { name: "Acme Storefront" }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${PROJECT_ID}$`));
  await expect(page.getByRole("heading", { name: "Acme Storefront" })).toBeVisible();

  // Pipeline + gate present, gate initially pending.
  await expect(page.getByLabel("Project pipeline phases")).toBeVisible();
  const approveArchitecture = page.getByTestId("approve-Architecture");
  await expect(approveArchitecture).toBeVisible();

  // 3. Approve the Architecture gate.
  await approveArchitecture.click();

  // 4. See it reflected: the approve button is gone and an approved-by line shows.
  await expect(page.getByTestId("gate-approved-Architecture")).toBeVisible();
  await expect(page.getByTestId("gate-approved-Architecture")).toContainText(
    "admin@softwarefactory.local",
  );
  await expect(page.getByTestId("approve-Architecture")).toHaveCount(0);
});
