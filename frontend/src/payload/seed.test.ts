import { describe, it, expect, afterEach, vi } from "vitest";
import type { Payload } from "payload";
import { seed } from "./seed";

/**
 * SEED PASSWORD POLICY (unit) — pins security audit fix #2: account passwords
 * are NEVER defaulted. Unset env ⇒ the account is SKIPPED with a loud log
 * (error-level in production), and the logged "set it and re-run" recovery
 * actually works — the admin gate keys on "no admin exists", not "collection
 * empty" (adversarial-review finding). Drives the real seed() against a
 * stubbed Payload; the root options.json supplies the flags (cms +
 * clientDashboard on).
 */

interface CreateCall {
  collection: string;
  data: Record<string, unknown>;
}

function stubPayload(state: { adminExists: boolean; ownerExists: boolean }) {
  const created: CreateCall[] = [];
  const logs = { info: [] as string[], warn: [] as string[], error: [] as string[] };
  const payload = {
    logger: {
      info: (m: string) => logs.info.push(m),
      warn: (m: string) => logs.warn.push(m),
      error: (m: string) => logs.error.push(m),
    },
    // Content collections report non-empty so only the user logic runs creates.
    count: async () => ({ totalDocs: 1 }),
    find: async (args: { collection: string; where?: Record<string, unknown> }) => {
      if (args.where && "role" in args.where) {
        return { totalDocs: state.adminExists ? 1 : 0 };
      }
      return { totalDocs: state.ownerExists ? 1 : 0 };
    },
    create: async (args: CreateCall) => {
      created.push(args);
      return { id: 1 };
    },
    update: async () => ({}),
    updateGlobal: async () => ({}),
  };
  return { payload: payload as unknown as Payload, created, logs };
}

const seededRoles = (created: CreateCall[]) =>
  created.filter((c) => c.collection === "users").map((c) => c.data.role);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("seed password policy (fix #2)", () => {
  it("skips BOTH accounts with loud warns when no password env is set", async () => {
    vi.stubEnv("PAYLOAD_ADMIN_PASSWORD", undefined);
    vi.stubEnv("DASHBOARD_OWNER_PASSWORD", undefined);
    const { payload, created, logs } = stubPayload({ adminExists: false, ownerExists: false });
    await seed(payload);
    expect(seededRoles(created)).toEqual([]);
    expect(logs.warn.join("\n")).toMatch(/PAYLOAD_ADMIN_PASSWORD/);
    expect(logs.warn.join("\n")).toMatch(/DASHBOARD_OWNER_PASSWORD/);
    // The unconditional first line names the manifest that drove the run — a
    // seed can never again be silent about whether/what it executed.
    expect(logs.info.join("\n")).toMatch(/\[seed\] manifest: /);
  });

  it("never seeds a literal default — the created password IS the env value", async () => {
    vi.stubEnv("PAYLOAD_ADMIN_PASSWORD", "from-env-admin");
    vi.stubEnv("DASHBOARD_OWNER_PASSWORD", "from-env-owner");
    const { payload, created } = stubPayload({ adminExists: false, ownerExists: false });
    await seed(payload);
    const users = created.filter((c) => c.collection === "users");
    expect(users.map((u) => u.data.password)).toEqual(["from-env-admin", "from-env-owner"]);
    expect(seededRoles(created)).toEqual(["admin", "owner"]);
  });

  it("logs at ERROR level in production when a password is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYLOAD_ADMIN_PASSWORD", undefined);
    vi.stubEnv("DASHBOARD_OWNER_PASSWORD", undefined);
    const { payload, logs } = stubPayload({ adminExists: false, ownerExists: false });
    await seed(payload);
    expect(logs.error.join("\n")).toMatch(/PAYLOAD_ADMIN_PASSWORD/);
    expect(logs.warn).toEqual([]);
  });

  it("recovery run works: owner already exists, admin env now set ⇒ admin is created", async () => {
    // First run skipped the admin (env unset) but created the owner; the
    // logged instruction says "set PAYLOAD_ADMIN_PASSWORD and re-run".
    vi.stubEnv("PAYLOAD_ADMIN_PASSWORD", "late-admin-password");
    vi.stubEnv("DASHBOARD_OWNER_PASSWORD", undefined);
    const { payload, created } = stubPayload({ adminExists: false, ownerExists: true });
    await seed(payload);
    expect(seededRoles(created)).toEqual(["admin"]);
  });

  it("does not touch an existing admin (idempotent re-runs)", async () => {
    vi.stubEnv("PAYLOAD_ADMIN_PASSWORD", "whatever");
    vi.stubEnv("DASHBOARD_OWNER_PASSWORD", undefined);
    const { payload, created, logs } = stubPayload({ adminExists: true, ownerExists: true });
    await seed(payload);
    expect(seededRoles(created)).toEqual([]);
    expect(logs.warn.join("\n")).not.toMatch(/PAYLOAD_ADMIN_PASSWORD/);
  });
});
