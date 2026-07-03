import "server-only";
import { readFile } from "node:fs/promises";
import bundledDefault from "./options.default.json";
import { getManifestCandidatePaths } from "./manifest-paths";
import type {
  EnabledSection,
  FeatureName,
  OptionsManifest,
  SectionName,
  SiteConfig,
  SiteType,
} from "./types";

export type { OptionsManifest } from "./types";

/**
 * Config loader — single source of truth for feature/section flags on the server.
 *
 * Vertical selection (Phase 2): the env var `OPTIONS_FILE` selects which options
 * variant to boot as (e.g. `options.restaurant.json`). It may be an ABSOLUTE path
 * or a path RELATIVE TO THE REPO ROOT (frontend/ sits one level below the root).
 * When unset, the loader reads the active root `options.json` (currently ecommerce).
 * If nothing can be read (e.g. a standalone container that doesn't ship the repo
 * root) it falls back to the bundled copy in options.default.json. All variants
 * must stay schema-compatible with options.schema.json.
 *
 * Cached per server process — options are build/deploy-time config, not per-request.
 */
let cached: OptionsManifest | null = null;

async function readManifest(): Promise<OptionsManifest> {
  // Candidate order lives in manifest-paths.ts, SHARED with the Payload REST
  // gate (src/payload/manifest-flags.ts) so both readers resolve the same
  // manifest. Recomputed per read so tests can flip env + reset the cache.
  for (const candidate of getManifestCandidatePaths()) {
    try {
      const raw = await readFile(candidate, "utf-8");
      return JSON.parse(raw) as OptionsManifest;
    } catch {
      // Try the next candidate.
    }
  }
  return bundledDefault as OptionsManifest;
}

/** Load (and cache) the options manifest. Server-only. */
export async function loadOptions(): Promise<OptionsManifest> {
  if (cached) return cached;
  cached = await readManifest();
  return cached;
}

/** Test/HMR hook to force a reload. */
export function __resetOptionsCache() {
  cached = null;
}

/**
 * The active vertical for this boot (`ecommerce` | `restaurant` | ...), selected
 * by `siteType` in the loaded options file. Drives nav, homepage sections and the
 * per-page `notFound()` guards on vertical-specific routes.
 */
export async function getSiteType(): Promise<SiteType> {
  const options = await loadOptions();
  return options.siteType;
}

/** Convenience predicate mirroring the backend `IFeatureManager.IsVertical(name)`. */
export async function isVertical(name: SiteType): Promise<boolean> {
  return (await getSiteType()) === name;
}

/** Is a feature flag enabled? (features.<name> === true) */
export async function isFeatureEnabled(name: FeatureName): Promise<boolean> {
  const options = await loadOptions();
  return options.features?.[name] === true;
}

/** Is a homepage/section enabled? (sections.<name>.enabled === true) */
export async function isSectionEnabled(name: SectionName): Promise<boolean> {
  const options = await loadOptions();
  return options.sections?.[name]?.enabled === true;
}

/** Enabled sections sorted by ascending `order` — drives homepage composition. */
export async function getEnabledSections(): Promise<EnabledSection[]> {
  const options = await loadOptions();
  return Object.entries(options.sections ?? {})
    .filter(([, cfg]) => cfg?.enabled)
    .map(([name, cfg]) => ({ name: name as SectionName, order: cfg.order }))
    .sort((a, b) => a.order - b.order);
}

/** Public site config for headers, metadata, currency, etc. */
export async function getSiteConfig(): Promise<SiteConfig> {
  const options = await loadOptions();
  return {
    siteName: options.siteName ?? "Software Factory Store",
    siteType: options.siteType,
    currency: options.currency ?? "SAR",
    defaultLocale: options.defaultLocale ?? "ar",
    defaultDirection: options.defaultDirection,
    designDirection: options.designDirection ?? "premium",
    payments: options.payments ?? [],
    integrations: options.integrations ?? [],
  };
}
