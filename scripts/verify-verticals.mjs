#!/usr/bin/env node
/**
 * BOOT-TWICE VALIDATION — generalization proof for the dual-vertical app.
 *
 * Loads options.ecommerce.json and options.restaurant.json and, for EACH vertical,
 * asserts:
 *   1. the expected homepage sections are present AND the wrong vertical's sections
 *      are absent;
 *   2. the derived primary-nav routes are present AND the wrong vertical's routes
 *      are absent (nav derivation mirrors frontend/src/components/layout/nav-items.ts);
 *   3. seed/feature expectations (the flags that gate seeded data + routes);
 *   4. the guarded route files exist on disk and contain a getSiteType(...) guard;
 *   5. (Phase 4) the client-dashboard nav derives ONLY from dashboard flags —
 *      present for both verticals when flags are on, EMPTY when
 *      features.clientDashboard is off — and every dashboard route file exists
 *      and calls the requireDashboardAccess guard;
 *   6. (Phase 4, security audit fix #3/#4) the Payload REST surface obeys the
 *      same gating: /api/users + /api/globals/siteSettings derive as DENIED to
 *      owner/staff whenever clientDashboard (or the module flag) is off, staff
 *      never get the settings surface at all, and the real access files carry
 *      the manifest gate (+ the settings/users pages their ownerOnly guard).
 *
 * Exits non-zero with a clear diff on any mismatch; prints a PASS summary table.
 * Pure node, no dependencies.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FRONTEND = path.join(ROOT, "frontend");
const APP = path.join(FRONTEND, "src", "app", "[locale]");

// ---------------------------------------------------------------------------
// Expectations per vertical (the "proof" — what MUST and MUST NOT be present).
// ---------------------------------------------------------------------------
const SPECS = {
  ecommerce: {
    file: "options.ecommerce.json",
    siteType: "ecommerce",
    sectionsPresent: ["hero", "categories", "productListing"],
    sectionsAbsent: ["menu", "branches", "reservation", "gallery", "promotions"],
    navPresent: ["/products", "/categories"],
    navAbsent: ["/menu", "/branches", "/reservations", "/gallery"],
    // Seed/feature expectations: the flags that gate seeded catalog data + routes.
    featuresOn: [
      "wishlist",
      "orderTracking",
      "clientDashboard",
      "cms",
      "dashboardOrders",
      "dashboardCatalog",
      "dashboardContent",
      "dashboardUsers",
      "dashboardSettings",
    ],
    featuresOff: ["reviews", "reservations", "branchLocator", "gallery", "promotions"],
    // Guarded route files (must exist + carry a getSiteType guard).
    guardedRoutes: ["products/page.tsx", "categories/page.tsx"],
  },
  restaurant: {
    file: "options.restaurant.json",
    siteType: "restaurant",
    sectionsPresent: ["menu", "branches", "reservation", "gallery", "promotions"],
    sectionsAbsent: ["productListing", "categories"],
    navPresent: ["/menu", "/reservations", "/branches", "/gallery"],
    navAbsent: ["/products", "/categories"],
    featuresOn: [
      "reservations",
      "branchLocator",
      "gallery",
      "promotions",
      "orderTracking",
      "clientDashboard",
      "cms",
      "dashboardOrders",
      "dashboardCatalog",
      "dashboardContent",
      "dashboardUsers",
      "dashboardSettings",
    ],
    featuresOff: ["reviews", "wishlist"],
    guardedRoutes: [
      "menu/page.tsx",
      "branches/page.tsx",
      "reservations/page.tsx",
      "gallery/page.tsx",
      "promotions/page.tsx",
    ],
  },
};

// ---------------------------------------------------------------------------
// Nav derivation — mirrors frontend/src/components/layout/nav-items.ts so the
// proof stays in lock-step with the code that actually renders the header.
// ---------------------------------------------------------------------------
const sectionOn = (o, name) => o.sections?.[name]?.enabled === true;
const featureOn = (o, name) => o.features?.[name] === true;

// ---------------------------------------------------------------------------
// Dashboard nav derivation (Phase 4) — mirrors
// frontend/src/features/dashboard/lib/nav.ts (owner view). Keep in lock-step.
// ---------------------------------------------------------------------------
function deriveDashboardNav(o) {
  if (!featureOn(o, "clientDashboard")) return [];
  const items = ["/dashboard"];
  if (featureOn(o, "dashboardOrders")) items.push("/dashboard/orders");
  if (featureOn(o, "dashboardCatalog")) items.push("/dashboard/catalog");
  if (featureOn(o, "dashboardContent") && featureOn(o, "cms")) items.push("/dashboard/content");
  if (featureOn(o, "dashboardUsers")) items.push("/dashboard/users");
  if (featureOn(o, "dashboardSettings")) items.push("/dashboard/settings");
  return items;
}

/** Dashboard route files that must exist AND call the dashboard guard. */
const DASHBOARD_ROUTES = [
  "dashboard/layout.tsx",
  "dashboard/page.tsx",
  "dashboard/orders/page.tsx",
  "dashboard/orders/[orderNumber]/page.tsx",
  "dashboard/catalog/page.tsx",
  "dashboard/content/page.tsx",
  "dashboard/users/page.tsx",
  "dashboard/settings/page.tsx",
];

/** Owner-only dashboard pages (audit fix #4): guard must pass ownerOnly. */
const OWNER_ONLY_ROUTES = ["dashboard/users/page.tsx", "dashboard/settings/page.tsx"];

// ---------------------------------------------------------------------------
// Payload REST gating derivation (security audit fix #3/#4) — mirrors
// frontend/src/payload/manifest-flags.ts (isDashboardModuleEnabled: master
// clientDashboard AND the module flag) plus the role scoping wired into
// collections/Users.ts and globals/SiteSettings.ts. Keep in lock-step.
// ---------------------------------------------------------------------------
function deriveDashboardRestAccess(o, role) {
  const moduleOn = (m) => featureOn(o, "clientDashboard") && featureOn(o, m);
  return {
    // /api/users management surface: admin always; owner needs the flags;
    // staff never manage users (self-scope only, which the flag also gates).
    users: role === "admin" || (role === "owner" && moduleOn("dashboardUsers")),
    // /api/globals/siteSettings update: admin always; owner needs the flags;
    // staff NEVER (owner-scoped role model, fix #4).
    siteSettings: role === "admin" || (role === "owner" && moduleOn("dashboardSettings")),
  };
}

/** Files that must carry the manifest gate for the Payload REST surface. */
const PAYLOAD_GATED_FILES = [
  "src/payload/collections/Users.ts",
  "src/payload/globals/SiteSettings.ts",
];

const DASHBOARD_NAV_ALL = [
  "/dashboard",
  "/dashboard/orders",
  "/dashboard/catalog",
  "/dashboard/content",
  "/dashboard/users",
  "/dashboard/settings",
];

function derivePrimaryNav(o) {
  const items = ["/"];
  if (o.siteType === "restaurant") {
    if (sectionOn(o, "menu")) items.push("/menu");
    if (featureOn(o, "reservations")) items.push("/reservations");
    if (sectionOn(o, "branches")) items.push("/branches");
    if (sectionOn(o, "gallery")) items.push("/gallery");
  } else {
    if (sectionOn(o, "productListing")) items.push("/products");
    if (sectionOn(o, "categories")) items.push("/categories");
  }
  if (sectionOn(o, "about")) items.push("/about");
  if (sectionOn(o, "faq")) items.push("/faq");
  if (sectionOn(o, "contact")) items.push("/contact");
  return items;
}

// ---------------------------------------------------------------------------
// Assertion harness.
// ---------------------------------------------------------------------------
const failures = [];
function check(vertical, label, cond, detail) {
  if (!cond) failures.push({ vertical, label, detail });
  return cond;
}

const rows = [];

for (const [vertical, spec] of Object.entries(SPECS)) {
  const file = path.join(ROOT, spec.file);
  let o;
  try {
    o = JSON.parse(readFileSync(file, "utf-8"));
  } catch (e) {
    failures.push({ vertical, label: "load", detail: `cannot read ${spec.file}: ${e.message}` });
    continue;
  }

  // 0. siteType
  check(
    vertical,
    "siteType",
    o.siteType === spec.siteType,
    `expected siteType=${spec.siteType}, got ${o.siteType}`,
  );

  // 1. sections present / absent
  for (const s of spec.sectionsPresent) {
    check(vertical, "section+", sectionOn(o, s), `section '${s}' expected enabled but is not`);
  }
  for (const s of spec.sectionsAbsent) {
    check(
      vertical,
      "section-",
      !(s in (o.sections ?? {})) || !sectionOn(o, s),
      `wrong-vertical section '${s}' should be ABSENT/disabled but is enabled`,
    );
  }

  // 2. nav present / absent (derived)
  const nav = derivePrimaryNav(o);
  for (const r of spec.navPresent) {
    check(vertical, "nav+", nav.includes(r), `nav route '${r}' expected but derived nav = [${nav.join(", ")}]`);
  }
  for (const r of spec.navAbsent) {
    check(
      vertical,
      "nav-",
      !nav.includes(r),
      `wrong-vertical nav route '${r}' should be ABSENT but derived nav = [${nav.join(", ")}]`,
    );
  }

  // 3. seed / feature expectations
  for (const f of spec.featuresOn) {
    check(vertical, "feature+", featureOn(o, f), `feature '${f}' expected true but is ${o.features?.[f]}`);
  }
  for (const f of spec.featuresOff) {
    check(vertical, "feature-", !featureOn(o, f), `feature '${f}' expected false/absent but is ${o.features?.[f]}`);
  }

  // 4. guarded route files exist + contain a getSiteType guard
  for (const rel of spec.guardedRoutes) {
    const p = path.join(APP, ...rel.split("/"));
    const exists = existsSync(p);
    check(vertical, "route-file", exists, `guarded route file missing: src/app/[locale]/${rel}`);
    if (exists) {
      const src = readFileSync(p, "utf-8");
      check(
        vertical,
        "route-guard",
        src.includes("getSiteType"),
        `guarded route src/app/[locale]/${rel} has no getSiteType(...) guard`,
      );
    }
  }

  // 5. Phase 4 — client dashboard gating.
  // 5a. With the manifest's flags (all on), the full dashboard nav derives.
  const dashNav = deriveDashboardNav(o);
  for (const r of DASHBOARD_NAV_ALL) {
    check(
      vertical,
      "dash-nav+",
      dashNav.includes(r),
      `dashboard nav route '${r}' expected but derived = [${dashNav.join(", ")}]`,
    );
  }
  // 5b. Flag OFF => the entire dashboard derives to ABSENT (404 / no nav).
  const dashOff = deriveDashboardNav({
    ...o,
    features: { ...o.features, clientDashboard: false },
  });
  check(
    vertical,
    "dash-nav-off",
    dashOff.length === 0,
    `clientDashboard=false must derive an EMPTY dashboard nav, got [${dashOff.join(", ")}]`,
  );
  // 5c. A single module flag off removes exactly that route.
  const dashNoOrders = deriveDashboardNav({
    ...o,
    features: { ...o.features, dashboardOrders: false },
  });
  check(
    vertical,
    "dash-module-off",
    !dashNoOrders.includes("/dashboard/orders") && dashNoOrders.includes("/dashboard/catalog"),
    `dashboardOrders=false must remove only /dashboard/orders, got [${dashNoOrders.join(", ")}]`,
  );
  // 5d. Dashboard route files exist and call the dashboard guard.
  for (const rel of DASHBOARD_ROUTES) {
    const p = path.join(APP, ...rel.split("/"));
    const exists = existsSync(p);
    check(vertical, "dash-route-file", exists, `dashboard route file missing: src/app/[locale]/${rel}`);
    if (exists) {
      const src = readFileSync(p, "utf-8");
      check(
        vertical,
        "dash-route-guard",
        src.includes("requireDashboardAccess"),
        `dashboard route src/app/[locale]/${rel} has no requireDashboardAccess(...) guard`,
      );
      if (OWNER_ONLY_ROUTES.includes(rel)) {
        check(
          vertical,
          "dash-owner-only",
          src.includes("ownerOnly: true"),
          `owner-only route src/app/[locale]/${rel} does not pass ownerOnly: true to the guard`,
        );
      }
    }
  }

  // 6. Payload REST gating (security audit fix #3/#4).
  // 6a. Shipped manifest (flags on): owner allowed, staff never manage
  //     users/settings, admin always allowed.
  const restOwner = deriveDashboardRestAccess(o, "owner");
  const restStaff = deriveDashboardRestAccess(o, "staff");
  const restAdmin = deriveDashboardRestAccess(o, "admin");
  check(vertical, "rest-owner+", restOwner.users && restOwner.siteSettings,
    "owner must derive ALLOWED on /api/users + /api/globals/siteSettings with flags on");
  check(vertical, "rest-staff-", !restStaff.users && !restStaff.siteSettings,
    "staff must derive DENIED on the users-manage + siteSettings surfaces (owner-scoped)");
  check(vertical, "rest-admin+", restAdmin.users && restAdmin.siteSettings,
    "admin (factory operator) must never be gated off the Payload REST surface");
  // 6b. clientDashboard=false ⇒ owner/staff denied on BOTH surfaces.
  const dashOffManifest = { ...o, features: { ...o.features, clientDashboard: false } };
  for (const role of ["owner", "staff"]) {
    const rest = deriveDashboardRestAccess(dashOffManifest, role);
    check(
      vertical,
      "rest-flag-off",
      !rest.users && !rest.siteSettings,
      `clientDashboard=false must deny ${role} on /api/users + /api/globals/siteSettings`,
    );
  }
  check(vertical, "rest-flag-off-admin",
    deriveDashboardRestAccess(dashOffManifest, "admin").users,
    "clientDashboard=false must keep the admin path open");
  // 6c. A single module flag off removes exactly that surface (owner view).
  const noUsers = deriveDashboardRestAccess(
    { ...o, features: { ...o.features, dashboardUsers: false } }, "owner");
  check(vertical, "rest-module-off", !noUsers.users && noUsers.siteSettings,
    "dashboardUsers=false must deny only /api/users, not siteSettings");
  const noSettings = deriveDashboardRestAccess(
    { ...o, features: { ...o.features, dashboardSettings: false } }, "owner");
  check(vertical, "rest-module-off", !noSettings.siteSettings && noSettings.users,
    "dashboardSettings=false must deny only /api/globals/siteSettings, not users");
  // 6d. The real access files carry the manifest gate (lock-step with the
  //     derivation above; behavior itself is pinned by
  //     src/payload/dashboard-rest-gating.test.ts).
  for (const rel of PAYLOAD_GATED_FILES) {
    const p = path.join(FRONTEND, ...rel.split("/"));
    const exists = existsSync(p);
    check(vertical, "rest-gate-file", exists, `Payload access file missing: frontend/${rel}`);
    if (exists) {
      const src = readFileSync(p, "utf-8");
      check(
        vertical,
        "rest-gate-wired",
        src.includes("isDashboardModuleEnabled("),
        `frontend/${rel} does not call the isDashboardModuleEnabled(...) manifest gate`,
      );
    }
  }

  rows.push({
    vertical,
    siteType: o.siteType,
    sections: nav.length,
    navPresent: spec.navPresent.join(" "),
    navAbsent: spec.navAbsent.join(" "),
    guards: spec.guardedRoutes.length,
  });
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
if (failures.length > 0) {
  console.error("\nFAIL — vertical generalization proof mismatches:\n");
  for (const f of failures) {
    console.error(`  [${f.vertical}] ${f.label}: ${f.detail}`);
  }
  console.error(`\n${failures.length} assertion(s) failed.`);
  process.exit(1);
}

console.log("\nBOOT-TWICE VALIDATION — PASS\n");
const pad = (s, n) => String(s).padEnd(n);
console.log(
  pad("VERTICAL", 12) + pad("siteType", 12) + pad("navRoutes", 10) + pad("guards", 8) + "wrong-vertical routes absent",
);
console.log("-".repeat(80));
for (const r of rows) {
  console.log(
    pad(r.vertical, 12) +
      pad(r.siteType, 12) +
      pad(r.sections, 10) +
      pad(r.guards, 8) +
      `absent: ${r.navAbsent}`,
  );
}
console.log(
  "\nEcommerce present: /products /categories | absent: /menu /branches /reservations /gallery",
);
console.log(
  "Restaurant present: /menu /reservations /branches /gallery | absent: /products /categories",
);
console.log("\nAll section, nav, feature-seed and route-guard assertions passed for BOTH verticals.\n");
process.exit(0);
