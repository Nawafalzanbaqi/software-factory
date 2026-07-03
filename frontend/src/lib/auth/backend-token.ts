import "server-only";
import { SignJWT } from "jose";

/**
 * Mints the short-lived bearer JWT the .NET backend trusts for authed
 * endpoints (ARCHITECTURE.md §4: frontend-issued token, shared symmetric key).
 * HS256 with BACKEND_JWT_KEY, which MUST equal the backend's `Jwt:Key`.
 *
 * FAIL-CLOSED (security audit fix #1): in production the key MUST come from
 * the environment — minting throws instead of silently signing with the
 * committed dev constant, so a misconfigured deployment can never accept
 * forgeable tokens. Outside production (dev server, e2e dev-mode runs) the
 * dev fallbacks below mirror the backend's appsettings.Development.json so the
 * local/CI stack works with zero configuration. The backend enforces the same
 * contract on its side (see Api/Identity/JwtStartupValidation.cs): outside
 * Development it refuses to boot with a missing/dev-constant key, issuer or
 * audience — so a production pairing requires the real env values on BOTH
 * sides (key 32+ bytes).
 *
 * Tokens are minted per request (lib/auth/session.ts getAccessToken), never
 * cached, so the 2-minute lifetime costs nothing and keeps the replay window
 * minimal (docs/PHASE4.md §1 records this decision).
 *
 * Claims: `sub` (user id, backend NameClaimType), `email`, `role`
 * (backend RoleClaimType — drives the DashboardStaff policy), `iss`/`aud`
 * (validated by the backend whenever its Jwt:Issuer/Jwt:Audience are set —
 * they ARE set in Development, and REQUIRED outside it).
 */

const DEV_FALLBACK_KEY = "dev-only-insecure-signing-key-change-me-32bytes!";
// Mirror backend appsettings.Development.json Jwt:Issuer / Jwt:Audience.
const DEV_FALLBACK_ISSUER = "software-factory";
const DEV_FALLBACK_AUDIENCE = "software-factory-web";

/** Replay window; see docstring — minted per request, so short is free. */
const TOKEN_LIFETIME = "2m";

export interface BackendTokenUser {
  id: string;
  email?: string | null;
  role?: string;
}

/** Empty string (e.g. compose's `${VAR:-}` passthrough) behaves as unset. */
const env = (value: string | undefined): string | undefined => value || undefined;

/**
 * Resolved at call time (not module scope) so `next build` can evaluate this
 * module without the env var; only an actual authed mint fails closed.
 */
function resolveSigningKey(): string {
  const key = env(process.env.BACKEND_JWT_KEY);
  if (key) return key;
  if (process.env.NODE_ENV !== "production") return DEV_FALLBACK_KEY;
  throw new Error(
    "BACKEND_JWT_KEY is not set. Refusing to mint a backend bearer with the " +
      "committed dev-only key in production — set BACKEND_JWT_KEY (32+ bytes, " +
      "identical to the backend's Jwt:Key).",
  );
}

export async function mintBackendToken(user: BackendTokenUser): Promise<string> {
  const secret = new TextEncoder().encode(resolveSigningKey());

  const jwt = new SignJWT({
    ...(user.email ? { email: user.email } : {}),
    ...(user.role ? { role: user.role } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_LIFETIME)
    // Always stamped: the backend validates them when its Jwt:Issuer /
    // Jwt:Audience are configured (always, outside Development) and ignores
    // them when not. A production backend requires non-dev values, so these
    // fallbacks can never satisfy it — set the env pair on both sides.
    // Empty-string envs normalize to the fallback (never mint `iss: ""`).
    .setIssuer(env(process.env.BACKEND_JWT_ISSUER) ?? DEV_FALLBACK_ISSUER)
    .setAudience(env(process.env.BACKEND_JWT_AUDIENCE) ?? DEV_FALLBACK_AUDIENCE);

  return jwt.sign(secret);
}
