import "server-only";
import { SignJWT } from "jose";

/**
 * Mints the short-lived bearer JWT the .NET backend trusts for authed
 * endpoints (ARCHITECTURE.md §4: frontend-issued token, shared symmetric key).
 * HS256 with BACKEND_JWT_KEY, which MUST equal the backend's `Jwt:Key`. The
 * dev fallback mirrors the backend's Program.cs fallback so the local
 * docker-compose stack works with zero configuration — neither value may ever
 * reach a real deployment (set both via env; 32+ bytes).
 *
 * Claims: `sub` (user id, backend NameClaimType), `email`, `role`
 * (backend RoleClaimType — drives the DashboardStaff policy).
 */

const DEV_FALLBACK_KEY = "dev-only-insecure-signing-key-change-me-32bytes!";

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
    .setExpirationTime("10m");

  // Optional — must match the backend's Jwt:Issuer / Jwt:Audience when set
  // there (the backend only validates these when configured).
  if (process.env.BACKEND_JWT_ISSUER) jwt.setIssuer(process.env.BACKEND_JWT_ISSUER);
  if (process.env.BACKEND_JWT_AUDIENCE) jwt.setAudience(process.env.BACKEND_JWT_AUDIENCE);

  return jwt.sign(secret);
}
