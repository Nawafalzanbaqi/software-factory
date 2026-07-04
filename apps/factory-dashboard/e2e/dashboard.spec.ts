import { test, expect } from "@playwright/test";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
// Type-only imports (erased at runtime — platform-api.ts is server-only) keep
// the mock payloads aligned with the DERIVED platform contract types.
import type {
  ApprovalGateDto,
  CreateProjectRequest,
  GateType,
  IntakeCatalogDto,
  ProjectDto,
} from "../src/lib/platform-api";

/**
 * E2E: sign in -> open a project -> approve a gate -> see it reflected,
 * plus the "New Project" intake flow -> detail page with options.json.
 *
 * The dashboard talks to the Platform API from the SERVER (Server Components +
 * server actions), so Playwright's `page.route` — which only intercepts the
 * BROWSER's requests — cannot mock those Node-side fetches. Instead we stand up
 * a tiny in-process mock Platform API on the same port the dev server points at
 * (PLATFORM_API_BASE_URL=http://localhost:5090). This keeps the test fully
 * deterministic with no live backend, exactly as intended. Mutable state lets an
 * approval POST (or a project POST) be reflected by the next GET.
 *
 * Enum values are camelCase ("build", "architecture") — the platform's actual
 * wire format per platform-contract.ts. The earlier PascalCase mock mirrored a
 * hand-written type that had drifted from the real API.
 *
 * `page.route` is still used to assert no stray browser->Platform calls leak.
 *
 * serial: every test shares the one mock server bound to port 5090; parallel
 * workers would each run beforeAll and collide on the port.
 */
test.describe.configure({ mode: "serial" });

const PROJECT_ID = "11111111-1111-1111-1111-111111111111";
const CLIENT_ID = "22222222-2222-2222-2222-222222222222";
const NEW_PROJECT_ID = "33333333-3333-3333-3333-333333333333";
const NEW_CLIENT_ID = "44444444-4444-4444-4444-444444444444";
const PORT = 5090;

let server: Server;
let gates: ApprovalGateDto[];
/** Projects created through POST /api/projects during the test run. */
let createdProjects: Map<string, { project: ProjectDto; optionsJson: string; intake: NonNullable<CreateProjectRequest["intake"]> }>;

function makeGates(projectId: string): ApprovalGateDto[] {
  return (["architecture", "security", "deploy"] as GateType[]).map((gateType, i) => ({
    id: `gate-${projectId}-${i}`,
    projectId,
    gateType,
    approvedBy: null,
    approvedAt: null,
    notes: null,
    isApproved: false,
  }));
}

const project: ProjectDto = {
  id: PROJECT_ID,
  clientId: CLIENT_ID,
  name: "Acme Storefront",
  siteType: "ecommerce",
  currentPhase: "build",
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

/** Mirrors the platform's IntakeCatalog for the site types this flow exercises. */
const intakeCatalog: IntakeCatalogDto = {
  market: "KSA",
  currency: "SAR",
  languages: ["ar", "en", "ar-en"],
  designDirections: ["clean", "premium", "bold", "tech"],
  payments: ["tamara", "tabby", "mada", "stripe"],
  integrations: ["zatca", "whatsapp", "maps"],
  features: [
    "clientDashboard",
    "cms",
    "reviews",
    "wishlist",
    "search",
    "faq",
    "loyalty",
    "analytics",
  ],
  siteTypes: [
    {
      siteType: "ecommerce",
      recommendedIntegrations: ["zatca"],
      sections: [
        { key: "hero", core: true, order: 1 },
        { key: "promoBanners", core: false, order: 2 },
        { key: "categories", core: false, order: 3 },
        { key: "productListing", core: true, order: 4 },
        { key: "reviews", core: false, order: 5 },
        { key: "about", core: false, order: 6 },
        { key: "faq", core: false, order: 7 },
        { key: "contact", core: false, order: 8 },
        { key: "footer", core: true, order: 99 },
      ],
    },
    {
      siteType: "restaurant",
      recommendedIntegrations: [],
      sections: [
        { key: "hero", core: true, order: 1 },
        { key: "menu", core: true, order: 3 },
        { key: "footer", core: true, order: 99 },
      ],
    },
  ],
};

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw));
  });
}

test.beforeAll(async () => {
  gates = makeGates(PROJECT_ID);
  createdProjects = new Map();

  server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    const { pathname } = url;
    const method = req.method ?? "GET";

    if (method === "GET" && pathname === "/api/clients") {
      return json(res, 200, clients);
    }
    if (method === "GET" && pathname === "/api/intake/catalog") {
      return json(res, 200, intakeCatalog);
    }
    if (method === "GET" && pathname === "/api/projects") {
      return json(res, 200, [
        project,
        ...[...createdProjects.values()].map((p) => p.project),
      ]);
    }
    if (method === "POST" && pathname === "/api/projects") {
      const body = JSON.parse(await readBody(req)) as CreateProjectRequest;
      const intake = body.intake;
      if (!intake || !intake.clientName || !intake.language) {
        return json(res, 400, {
          status: 400,
          title: "Validation failed",
          detail: "intake payload incomplete",
        });
      }
      // The real options.json generator is unit-tested platform-side; the mock
      // reflects the same header fields so the detail page shows real content.
      const optionsJson = JSON.stringify(
        {
          $schema: "./options.schema.json",
          siteType: body.siteType,
          siteName: body.name,
          language: intake.language,
          defaultLocale: intake.language === "en" ? "en" : "ar",
          defaultDirection: intake.language === "en" ? "ltr" : "rtl",
          currency: "SAR",
          payments: intake.payments ?? [],
          integrations: intake.integrations ?? [],
          designDirection: intake.designDirection,
        },
        null,
        2,
      );
      const created: ProjectDto = {
        id: NEW_PROJECT_ID,
        clientId: NEW_CLIENT_ID,
        name: body.name,
        siteType: body.siteType,
        currentPhase: "intake",
        repoUrl: null,
        branch: null,
        liveUrl: null,
        createdAt: new Date().toISOString(),
      };
      createdProjects.set(NEW_PROJECT_ID, { project: created, optionsJson, intake });
      return json(res, 201, created);
    }
    if (method === "GET" && pathname === `/api/projects/${PROJECT_ID}`) {
      // Nested shape, matching the real Platform API ProjectDetailDto.
      return json(res, 200, {
        project,
        gates,
        usage: { records: [], totalCostUsd: 1.2345, totalTokens: 123456 },
        recentDeployments: [],
        intake: null,
        optionsJson: null,
      });
    }
    if (method === "GET" && pathname === `/api/projects/${NEW_PROJECT_ID}`) {
      const entry = createdProjects.get(NEW_PROJECT_ID);
      if (!entry) return json(res, 404, { error: "not found" });
      return json(res, 200, {
        project: entry.project,
        gates: makeGates(NEW_PROJECT_ID),
        usage: { records: [], totalCostUsd: 0, totalTokens: 0 },
        recentDeployments: [],
        intake: {
          clientName: entry.intake.clientName,
          clientContact: entry.intake.clientContact,
          language: entry.intake.language,
          defaultDirection: entry.intake.language === "en" ? "ltr" : "rtl",
          designDirection: entry.intake.designDirection,
          sections: entry.intake.sections ?? [],
          payments: entry.intake.payments ?? [],
          integrations: entry.intake.integrations ?? [],
          features: entry.intake.features ?? [],
          notes: entry.intake.notes ?? null,
        },
        optionsJson: entry.optionsJson,
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
    if (method === "GET" && pathname === `/api/projects/${NEW_PROJECT_ID}/usage`) {
      return json(res, 200, { records: [], totalCostUsd: 0, totalTokens: 0 });
    }
    if (method === "GET" && pathname.startsWith("/api/analytics/")) {
      const projectId = pathname.split("/").pop();
      return json(res, 200, {
        projectId,
        provider: "noop",
        visitors: 0,
        pageViews: 0,
        bounceRate: 0,
        timeseries: [],
      });
    }
    if (method === "POST" && pathname === `/api/projects/${PROJECT_ID}/approvals`) {
      const body = JSON.parse((await readBody(req)) || "{}") as {
        gateType: string;
        approvedBy: string;
      };
      const gate = gates.find((g) => g.gateType === body.gateType);
      if (gate) {
        gate.isApproved = true;
        gate.approvedBy = body.approvedBy;
        gate.approvedAt = new Date().toISOString();
      }
      return json(res, 200, gate);
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

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("admin@softwarefactory.local");
  await page.getByLabel("Password").fill("e2e-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/projects$/);
}

test("admin signs in, opens a project, approves a gate, and sees it reflected", async ({
  page,
}) => {
  // Guard: no browser-side calls should ever leak to the Platform API.
  await page.route("**/localhost:5090/**", (route) => route.abort());

  // 1. Sign in (credentials checked against ADMIN_EMAIL/ADMIN_PASSWORD env).
  await signIn(page);
  await expect(page.getByRole("link", { name: "Acme Storefront" })).toBeVisible();

  // 2. Open the project detail.
  await page.getByRole("link", { name: "Acme Storefront" }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${PROJECT_ID}$`));
  await expect(page.getByRole("heading", { name: "Acme Storefront" })).toBeVisible();

  // Pipeline + gate present, gate initially pending.
  await expect(page.getByLabel("Project pipeline phases")).toBeVisible();
  const approveArchitecture = page.getByTestId("approve-architecture");
  await expect(approveArchitecture).toBeVisible();

  // 3. Approve the Architecture gate.
  await approveArchitecture.click();

  // 4. See it reflected: the approve button is gone and an approved-by line shows.
  await expect(page.getByTestId("gate-approved-architecture")).toBeVisible();
  await expect(page.getByTestId("gate-approved-architecture")).toContainText(
    "admin@softwarefactory.local",
  );
  await expect(page.getByTestId("approve-architecture")).toHaveCount(0);
});

test("admin registers a new project through the intake flow and lands on its detail page", async ({
  page,
}) => {
  await page.route("**/localhost:5090/**", (route) => route.abort());

  await signIn(page);

  // Open the guided intake.
  await page.getByRole("link", { name: "New Project" }).click();
  await expect(page).toHaveURL(/\/projects\/new$/);
  await expect(page.getByRole("heading", { name: "New Project" })).toBeVisible();

  // ---- Step 1: basics ----
  await page.getByLabel(/Client name/).fill("Noor Trading");
  await page.getByLabel(/Client contact/).fill("noor@example.com");
  await page.getByLabel(/Project name/).fill("Noor Boutique");
  // ecommerce is pre-selected (first catalog entry); pick language + design.
  await expect(page.getByRole("radio", { name: /E-commerce/ })).toBeChecked();
  await page.getByRole("radio", { name: /Arabic \+ English/ }).check();
  await page.getByRole("radio", { name: /Premium/ }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // ---- Step 2: sections (core pre-checked and locked) ----
  const heroBox = page.getByRole("checkbox", { name: /^Hero/ });
  await expect(heroBox).toBeChecked();
  await expect(heroBox).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: /^Product listing/ })).toBeChecked();
  await page.getByRole("checkbox", { name: /^Categories/ }).check();
  await page.getByRole("checkbox", { name: /^FAQ/ }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // ---- Step 3: optional add-ons; ZATCA is flagged as recommended for KSA ecommerce ----
  await page.getByRole("checkbox", { name: /Tamara/ }).check();
  await page.getByRole("checkbox", { name: /Tabby/ }).check();
  await expect(page.getByText("Recommended · KSA")).toBeVisible();
  await page.getByRole("checkbox", { name: /ZATCA/ }).check();
  await page.getByRole("checkbox", { name: /Client dashboard/ }).check();
  await page.getByRole("checkbox", { name: /CMS/ }).check();
  await page.getByRole("checkbox", { name: /Analytics/ }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // ---- Step 4: review shows the derived direction, then submit ----
  await expect(page.getByText("Noor Trading · noor@example.com")).toBeVisible();
  await expect(page.getByText("RTL", { exact: true })).toBeVisible();
  await page.getByTestId("submit-project").click();

  // Redirected to the new project's detail page.
  await expect(page).toHaveURL(new RegExp(`/projects/${NEW_PROJECT_ID}$`));
  await expect(page.getByRole("heading", { name: "Noor Boutique" })).toBeVisible();

  // Pipeline is shown with the project at the first (intake) phase.
  await expect(page.getByLabel("Project pipeline phases")).toBeVisible();

  // The generated options.json is displayed read-only and copyable.
  const optionsJson = page.getByTestId("options-json");
  await expect(optionsJson).toBeVisible();
  await expect(optionsJson).toContainText('"siteType": "ecommerce"');
  await expect(optionsJson).toContainText('"defaultDirection": "rtl"');
  await expect(page.getByTestId("copy-options-json")).toBeVisible();
});
