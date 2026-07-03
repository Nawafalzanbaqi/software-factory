import path from "path";

/**
 * Ordered candidate paths for the options.json manifest — the ONE definition
 * shared by the async route-gating loader (lib/config/options.ts) and the sync
 * Payload REST gate (src/payload/manifest-flags.ts), so the two readers can
 * never disagree about WHICH manifest is in effect.
 *
 * Dependency-free and NOT `server-only`: the Payload CLI (generate:types,
 * payload run) loads it through the collections' import graph.
 *
 * Order: an explicit `OPTIONS_FILE` (Phase 2 vertical switch; absolute, or
 * relative to the repo root) is tried first, then the root `options.json`
 * (cwd = frontend/ or repo root), then the legacy container override.
 */
export function getManifestCandidatePaths(): string[] {
  const candidates: string[] = [];

  const optionsFile = process.env.OPTIONS_FILE;
  if (optionsFile) {
    if (path.isAbsolute(optionsFile)) {
      candidates.push(optionsFile);
    } else {
      // Relative to repo root. Support cwd = frontend/ (normal) and cwd = repo root.
      candidates.push(path.resolve(process.cwd(), "..", optionsFile));
      candidates.push(path.resolve(process.cwd(), optionsFile));
    }
  }

  return [
    ...candidates,
    // Monorepo layout: frontend/ sits next to options.json.
    path.resolve(process.cwd(), "..", "options.json"),
    // In case cwd is the repo root.
    path.resolve(process.cwd(), "options.json"),
    // Explicit override for containerized deploys.
    process.env.OPTIONS_MANIFEST_PATH ?? "",
  ].filter(Boolean);
}
