import "server-only";
import { SignJWT } from "jose";

/**
 * Mints the short-lived bearer JWT the .NET backend trusts for authed
 * endpoints (ARCHITECTURE.md §4: frontend-issued token, shared symmetric key).
 * HS256 with BACKEND_JWT_KEY, which MUST equal the backend's `Jwt:Key`. The
 * dev fallbacks (key + issuer + audience) mirror the backend's
 * appsettings.Development.json so the local/CI docker-compose stack works with
 * zero configuration — none of them may ever reach a real deployment (set the
 * env pairs on both sides; key 32+ bytes).
 *
 * Claims: `sub` (user id, backend NameClaimType), `email`, `role`
 * (backend RoleClaimType — drives the DashboardStaff policy), `iss`/`aud`
 * (validated by the backend whenever its Jwt:Issuer/Jwt:Audience are set —
 * they ARE set in Development).
 */

const DEV_FALLBACK_KEY = "dev-only-insecure-signing-key-change-me-32bytes!";
// Mirror backend appsettings.Development.json Jwt:Issuer / Jwt:Audience.
const DEV_FALLBACK_ISSUER = "software-factory";
const DEV_FALLBACK_AUDIENCE = "software-factory-web";

export interface BackendTokenUser {
  id: string;
  email?: string | null;
  role?: string;
}

export async function mintBackendToken(user: BackendTokenUser): Promise<string> {
  const key = process.env.BACKEND_JWT_KEY ?? DEV_FALLBACK_KEY;
  const secret = new TextEncoder().encode(key);

  const jwt = new SignJWT({
    ...(user.email ? { email: user.email } : {}),
    ...(user.role ? { role: user.role } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("10m")
    // Always stamped: the backend validates them when its Jwt:Issuer /
    // Jwt:Audience are configured and ignores them when not.
    .setIssuer(process.env.BACKEND_JWT_ISSUER ?? DEV_FALLBACK_ISSUER)
    .setAudience(process.env.BACKEND_JWT_AUDIENCE ?? DEV_FALLBACK_AUDIENCE);

  return jwt.sign(secret);
}
