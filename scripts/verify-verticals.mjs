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
 *   4. the guarded route files exist on disk and contain a getSiteType(...) guard.
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
    featuresOn: ["wishlist", "orderTracking", "clientDashboard", "cms"],
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
    featuresOn: ["reservations", "branchLocator", "gallery", "promotions", "orderTracking"],
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
