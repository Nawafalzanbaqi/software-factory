import { readFileSync } from "fs";
// Relative (not `@/`): this module is also loaded by the Payload CLI, where
// only relative/`@payload-config` imports are exercised today.
import { getManifestCandidatePaths } from "../lib/config/manifest-paths";

/**
 * Manifest feature flags for Payload access rules (security audit fix #3).
 *
 * The Payload REST surface (/api/users, /api/globals/siteSettings) must obey
 * the same options.json gating as the dashboard routes: flag off ⇒ the surface
 * is ABSENT for owner/staff (the factory-operator `admin` path stays open).
 * Collection/global access functions call isDashboardModuleEnabled below.
 *
 * Deliberately NOT `@/lib/config/options` (that module is `server-only`, and
 * collections are also loaded by the Payload CLI — generate:types, payload
 * run). Sync reads (access functions are sync) over the SAME candidate chain —
 * imported from lib/config/manifest-paths.ts, not mirrored — so REST gating
 * and route gating always resolve the same manifest file.
 *
 * FAIL-CLOSED divergence (adversarial-review finding): when NO manifest is
 * readable at all, the route loader falls back to the bundled default (broken
 * pages beat a blank site), but this ACCESS gate treats missing manifest as
 * "no flags" ⇒ owner/staff denied — matching the backend, whose feature
 * manager maps an unreadable manifest to zero features (endpoints unmapped).
 * Deny-vs-broken-UI is the safe direction for an authorization gate.
 */

interface ManifestFlags {
  features?: Record<string, boolean>;
}

let cached: ManifestFlags | null = null;

function loadManifestFlags(): ManifestFlags {
  if (cached) return cached;
  for (const candidate of getManifestCandidatePaths()) {
    try {
      cached = JSON.parse(readFileSync(candidate, "utf-8")) as ManifestFlags;
      return cached;
    } catch {
      // Try the next candidate.
    }
  }
  // No readable manifest ⇒ no flags ⇒ every gated surface denies (see above).
  cached = { features: {} };
  return cached;
}

/** Dashboard modules with a Payload REST surface. */
export type DashboardRestModule = "dashboardUsers" | "dashboardSettings";

/**
 * True only when the master `clientDashboard` flag AND the module's own flag
 * are enabled — the same AND rule the route guards apply (guards.ts).
 */
export function isDashboardModuleEnabled(module: DashboardRestModule): boolean {
  const features = loadManifestFlags().features ?? {};
  return features.clientDashboard === true && features[module] === true;
}

/** Test/HMR hook to force a reload (mirrors lib/config/options.ts). */
export function __resetManifestFlagsCache(): void {
  cached = null;
}
