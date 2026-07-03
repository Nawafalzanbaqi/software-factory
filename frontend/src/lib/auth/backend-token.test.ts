// @vitest-environment node
// (jose's WebCrypto path checks `instanceof Uint8Array`, which fails across
// the jsdom/node realm boundary — this is pure server code, so run it in node.)
import { describe, it, expect, afterEach, vi } from "vitest";
import { jwtVerify } from "jose";
import { mintBackendToken } from "./backend-token";

/**
 * BACKEND BEARER MINTING (unit) — pins the frontend half of security audit
 * fix #1 (fail closed in production without BACKEND_JWT_KEY; dev fallback only
 * outside production) and fix #6 (2-minute lifetime). Reverting either would
 * turn these red — no other suite exercises NODE_ENV=production minting.
 */

const DEV_KEY = "dev-only-insecure-signing-key-change-me-32bytes!";
const REAL_KEY = "unit-test-production-signing-key-0123456789";
const USER = { id: "user-1", email: "owner@test.local", role: "owner" };

const verify = (token: string, key: string) =>
  jwtVerify(token, new TextEncoder().encode(key));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("mintBackendToken — fail-closed key resolution (fix #1)", () => {
  it("THROWS in production when BACKEND_JWT_KEY is unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BACKEND_JWT_KEY", undefined);
    await expect(mintBackendToken(USER)).rejects.toThrow(/BACKEND_JWT_KEY/);
  });

  it("THROWS in production when BACKEND_JWT_KEY is the empty string (compose `${VAR:-}`)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BACKEND_JWT_KEY", "");
    await expect(mintBackendToken(USER)).rejects.toThrow(/BACKEND_JWT_KEY/);
  });

  it("mints with the configured key in production (signature verifies)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BACKEND_JWT_KEY", REAL_KEY);
    const token = await mintBackendToken(USER);
    const { payload, protectedHeader } = await verify(token, REAL_KEY);
    expect(protectedHeader.alg).toBe("HS256");
    expect(payload.sub).toBe(USER.id);
    expect(payload.role).toBe(USER.role);
    expect(payload.email).toBe(USER.email);
  });

  it("falls back to the dev key ONLY outside production", async () => {
    vi.stubEnv("BACKEND_JWT_KEY", undefined);
    const token = await mintBackendToken(USER); // NODE_ENV=test here
    const { payload } = await verify(token, DEV_KEY);
    expect(payload.iss).toBe("software-factory");
    expect(payload.aud).toBe("software-factory-web");
  });

  it("normalizes empty-string issuer/audience to the fallback (never `iss: \"\"`)", async () => {
    vi.stubEnv("BACKEND_JWT_ISSUER", "");
    vi.stubEnv("BACKEND_JWT_AUDIENCE", "");
    const token = await mintBackendToken(USER);
    const { payload } = await verify(token, DEV_KEY);
    expect(payload.iss).toBe("software-factory");
    expect(payload.aud).toBe("software-factory-web");
  });
});

describe("mintBackendToken — 2-minute lifetime (fix #6)", () => {
  it("stamps exp exactly 120 seconds after iat", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BACKEND_JWT_KEY", REAL_KEY);
    const token = await mintBackendToken(USER);
    const { payload } = await verify(token, REAL_KEY);
    expect(payload.exp! - payload.iat!).toBe(120);
  });
});
