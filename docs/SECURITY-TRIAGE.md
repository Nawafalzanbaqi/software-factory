# Security Triage — Dependabot Alerts (2026-07-03)

Branch: `chore/main-green-vault-triage`. Policy applied:
`prompt-vault/security-standards.md` §6 (severity SLA, regenerate-never-hand-edit
lockfiles, peer-supported combinations only, no net9.0 downgrades, full-suite
verification).

## 0. Starting state

- **70 open Dependabot alerts**: 4 critical · 15 high · 43 medium · 8 low.
  66 against `frontend/package-lock.json`, 4 against
  `apps/factory-dashboard/package-lock.json`. Zero against NuGet.
- `main` CI red: the **Factory Dashboard** job failed at `npm ci` with `ERESOLVE` —
  merged Dependabot PR #5 bumped `next` to 15.5.20, whose
  `peerOptional @playwright/test ^1.51.1` conflicts with the still-pinned
  `@playwright/test 1.49.1` (the companion playwright Dependabot PR was closed, not
  merged). Root cause: partial application of a coupled upgrade set — exactly what this
  pass's "regenerate the whole set, verify, one PR" policy prevents.

## 1. Outcome

- **npm audit: 0 vulnerabilities** in `frontend/` and `apps/factory-dashboard/`
  (fresh lockfiles, clean `npm ci` from both).
- **`dotnet list package --vulnerable --include-transitive`: clean** for
  `backend/SoftwareFactory.sln`, `platform/SoftwareFactory.Platform.sln`,
  `apps/factory-bot/FactoryBot.sln` (no NuGet lockfiles in use — versions are centrally
  pinned in `Directory.Packages.props`; nothing to regenerate).
- All 70 alerts are expected to auto-close when this branch merges to `main`
  (Dependabot re-scans the default branch's lockfiles).
- No alert was left unfixed; nothing required a pin-and-accept exception.

## 2. Resolution by package (what closes which alerts)

### frontend (66 alerts)

| Package (alerts) | Severity (worst) | From → To | Decision |
|---|---|---|---|
| `next` ×21 (#13,16,17,18,19,20,27,28,40,48,49,50,51,52,53,54,55,56,57,58,59) | **critical** (RCE GHSA-9qr9-h5gf-34mp) | 15.2.3 → **16.2.10** | Upgrade across one major — forced, see §3.1 |
| `payload` ×6, `@payloadcms/next` ×3, `@payloadcms/graphql` ×3, `@payloadcms/drizzle` ×1 (#4–9,21,22,24,30,31,32,33,34,35) | **critical** (pre-auth account takeover GHSA-hp5w-3hxx-vmwf; SQLi GHSA-xx6w-jxg9-2wh8) | 3.37.0 → **3.85.2** (all `@payloadcms/*` + `payload` in lockstep) | Upgrade; ≥ 3.79.1 required for the criticals, took latest 3.x |
| `drizzle-orm` #39 (transitive via `@payloadcms/db-postgres`) | high (SQLi GHSA-gpj5-g38j-94v9) | 0.36.x → **0.45.2** | Resolved by the payload upgrade; verified in lockfile |
| `playwright`/`@playwright/test` #14 | high (browser download w/o verification GHSA-7mvr-c777-76hp) | 1.49.1 → **1.61.1** | Upgrade (needs ≥ 1.55.1) |
| `dompurify` ×16 (#25,29,36,37,42,43,44,45,64,65,66,67,68,69,70,71; transitive via `monaco-editor` in Payload admin) | medium | 3.2.x → **3.4.11** | npm **override** `"dompurify": "^3.4.11"` — upstream pin lags; 3.4.11 exits every advisory range incl. #67 (no-patch row applies to ≤ 3.4.6 only) |
| `next-intl` #41 (open redirect), #47 (prototype pollution) | medium | 3.26.3 → **4.13.1** | Upgrade across one major — no 3.x patch exists; source already used v4-style APIs (`defineRouting`, `createNavigation`, `requestLocale`), zero code changes needed |
| `next-auth` #15 | medium (email misdelivery GHSA-5jpx-9hw9-2fx4) | 5.0.0-beta.25 → **5.0.0-beta.31** | Upgrade (fix in beta.30) |
| `ajv` #23 (transitive) | medium (ReDoS) | → **8.18.0** | Resolved by payload upgrade |
| `esbuild` #2 (transitive: `@payloadcms/db-postgres` → `drizzle-kit` → archived `@esbuild-kit/*`) | medium (dev-server request forgery) | 0.18.20 → **0.25.x** | Scoped npm **override** `"@esbuild-kit/core-utils": {"esbuild": "^0.25.0"}` — upstream chain is archived, no fixed release exists; dev-time CLI path only |
| `file-type` #26 (transitive via payload uploads) | medium (ASF infinite loop) | → **21.3.4** | Resolved by payload upgrade |
| `postcss` #46 | medium (GHSA-qx2v-qp2m-jg93) | 8.5.1 → **8.5.16** + override for Next's vendored copy | Direct bump; `next` pins its own `postcss 8.4.31` internally → npm **override** `"next": {"postcss": "8.5.16"}` dedupes it |
| `uuid` #60 (transitive) | medium | → **13.0.2** | Resolved by payload upgrade |
| `@eslint/plugin-kit` #3 (transitive via eslint) | low (ReDoS) | → **0.4.1** | `eslint` 9.18.0 → 9.39.4 (its dep range pulls the fix) |

Companion (non-alert) changes forced by the above, kept in the same set:
`react`/`react-dom` 19.0.0 → **19.2.7** (+ matching `@types/*`) because
`@payloadcms/richtext-lexical@3.85.2` peer-requires a patched React
(`^19.0.1 || ^19.1.2 || ^19.2.1`); `eslint-config-next` → **16.2.10** to match next.

### apps/factory-dashboard (4 alerts)

| Package (alert) | Severity | From → To | Decision |
|---|---|---|---|
| `playwright` #77 | high | 1.49.1 → **1.61.1** | Upgrade — also resolves the `npm ci` ERESOLVE that broke `main` CI |
| `next-auth` #78 | medium | beta.25 → **beta.31** | Upgrade |
| `postcss` #87 | medium | 8.5.1 → **8.5.16** + `"next": {"postcss": "8.5.16"}` override | Same as frontend |
| `@eslint/plugin-kit` #72 | low | → **0.4.1** | via `eslint` 9.18.0 → 9.39.4 |

Companion: `eslint-config-next` 15.2.3 → **15.5.20** (aligns with the already-merged
`next 15.5.20`). The dashboard stays on Next 15.5 (no Payload constraint there;
15.5.20 has no open advisories).

## 3. Decisions & rationale

### 3.1 Why the frontend moved to Next 16 (the forcing chain)

1. Fixing the `next` highs (GHSA-8h8q/36qx/267c/c4j6/mg66 → 15.5.16, GHSA-26hh →
   15.5.18) requires **≥ 15.5.18** on the 15.x line — verified against the GitHub
   Advisory ranges: none of these have 15.4.x backport rows (`>= 13.0.0, < 15.5.16`
   style ranges), so parking on 15.4.11 would leave 6 highs open.
2. Fixing the `payload` criticals requires **≥ 3.79.1**, and every `@payloadcms/next`
   3.x release peer-supports only
   `>=15.2.9 <15.3.0 || >=15.3.9 <15.4.0 || >=15.4.11 <15.5.0 || >=16.2.6 <17` —
   **Payload never certified Next 15.5.**
3. Therefore no Next-15 version satisfies both. The only peer-clean, fully-patched
   combination is **next 16.2.10 + payload 3.85.2** (+ react 19.2.7). Forcing
   next 15.5 + payload with `--legacy-peer-deps` was rejected — that class of
   force-resolution is what broke `main` (see §0), and Payload explicitly does not
   support 15.5.
4. Migration surface was audited before committing: async `params: Promise<…>` already
   in use, `middleware.ts` still supported, next-intl request config already v4-shaped.
   Actual changes needed: `lint` script `next lint` → `eslint .` (removed in 16),
   `eslint.config.mjs` to eslint-config-next 16's native flat exports, two lint fixes
   demanded by the stricter react-hooks v7 / TS rules (`usePromoCarousel` event-driven
   state priming; `tailwind.config.ts` `require` → import). Verified by the full suite
   (§4).

### 3.2 Overrides (tracked exceptions — remove when upstream catches up)

| Override | Reason | Remove when |
|---|---|---|
| `next > postcss = 8.5.16` (frontend + dashboard) | Next vendors `postcss 8.4.31` (GHSA-qx2v-qp2m-jg93) | Next ships postcss ≥ 8.5.10 |
| `dompurify = ^3.4.11` (frontend) | `monaco-editor` (Payload admin) pins a vulnerable line | monaco-editor/payload bump their pin |
| `@esbuild-kit/core-utils > esbuild = ^0.25.0` (frontend) | `drizzle-kit` depends on archived `@esbuild-kit/*` stuck on esbuild 0.18 | drizzle-kit drops @esbuild-kit (it migrated to tsx upstream) |

### 3.3 Process decisions

- Lockfiles were **regenerated from scratch** (`rm node_modules package-lock.json && npm install`),
  never hand-edited; `npm ci` verified green from the committed lockfiles.
- `.NET`: no vulnerable packages, no downgrades, targets stay `net9.0`; central pins in
  `Directory.Packages.props` untouched this pass.
- `next-env.d.ts` (auto-generated) was tracked in `apps/factory-dashboard/` — now
  gitignored there (its `.gitignore` had a typo'd `next-env.d.ts.timestamp` entry),
  added to the root ignore, and removed from the index. `frontend/` already ignored it.

## 4. Verification

Full suite run on this branch (see PR checks for the authoritative CI run):
backend `dotnet test` (unit + Testcontainers integration + boot-twice routing proof),
platform `dotnet test` (EF InMemory), factory-bot `dotnet test`, frontend
`lint` + `typecheck` + `test:unit` + `build` (both verticals) + Playwright E2E
(ecommerce + restaurant) , factory-dashboard `lint` + `typecheck` + `build` + Playwright
E2E (mocked Platform API), `node scripts/verify-verticals.mjs`, Lighthouse CI budgets
(ecommerce + restaurant configs).

## 5. Standing policy

Future alerts follow `prompt-vault/security-standards.md` §6: critical/high fixed in
the next working pass (upgrade when the full suite proves it safe; pin+document only
when genuinely breaking), moderate/low batched when safe, every decision recorded here.
