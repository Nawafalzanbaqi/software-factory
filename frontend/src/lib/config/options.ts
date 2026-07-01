import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import bundledDefault from "./options.default.json";
import type {
  EnabledSection,
  FeatureName,
  OptionsManifest,
  SectionName,
  SiteConfig,
} from "./types";

export type { OptionsManifest } from "./types";

/**
 * Config loader — single source of truth for feature/section flags on the server.
 *
 * Loads the ROOT options.json (../options.json relative to the frontend project)
 * at runtime; if it cannot be read (e.g. in a standalone container that doesn't
 * ship the repo root) it falls back to the bundled copy in options.default.json.
 * Both must stay schema-compatible with options.schema.json.
 *
 * Cached per server process — options are build/deploy-time config, not per-request.
 */
let cached: OptionsManifest | null = null;

const CANDIDATE_PATHS = [
  // Monorepo layout: frontend/ sits next to options.json.
  path.resolve(process.cwd(), "..", "options.json"),
  // In case cwd is the repo root.
  path.resolve(process.cwd(), "options.json"),
  // Explicit override for containerized deploys.
  process.env.OPTIONS_MANIFEST_PATH ?? "",
].filter(Boolean);

async function readManifest(): Promise<OptionsManifest> {
  for (const candidate of CANDIDATE_PATHS) {
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
