// CJS package: default-import + destructure (a named ESM import fails under tsx).
import nextEnv from "@next/env";

/**
 * Seed entrypoint: `npm run payload:seed` (tsx src/payload/seed.run.ts).
 *
 * Runs under tsx DIRECTLY, not `payload run`: the payload bin dynamic-imports
 * the script through tsx's async worker loader and calls process.exit(0) the
 * moment the import resolves — on CI (node 20) that intermittently ended the
 * step with exit 0, ZERO log output and NO users created, and the
 * owner-login warmup then timed out minutes later with a misleading error
 * (e2e-dashboard-real: runs 28676046198 / 28677299065). Executing this module
 * as the tsx ENTRY avoids that loader race, and the script owns its exit
 * semantics: payload.destroy() closes the pg pool so node exits naturally and
 * pino's worker-thread transport flushes — never process.exit() here, it
 * truncates async log transports. The unref'd timer is a last-resort hard
 * exit that fires only if a stray handle keeps the event loop alive; it never
 * holds the loop open itself.
 *
 * Env loading: `payload run` loaded frontend/.env before evaluating the
 * config; @next/env reproduces that (and matches how the Next server reads
 * env), which is why payload/config/seed are imported dynamically AFTER it.
 */
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const [{ getPayload }, { default: config }, { seed }] = await Promise.all([
  import("payload"),
  import("@payload-config"),
  import("./seed"),
]);

const payload = await getPayload({ config });
await seed(payload);
payload.logger.info("[seed.run] complete");
await payload.destroy().catch((error: unknown) => {
  payload.logger.warn(`[seed.run] payload.destroy() failed (ignored): ${String(error)}`);
});
setTimeout(() => process.exit(0), 3_000).unref();
