# Security Standards — The Security Gate

Binding for **every** change in this repository, all tiers. Security is one of the three
human approval gates in the factory pipeline (Architecture / **Security** / Deploy —
`GateType` in the platform). A change that weakens any rule below fails the gate.

## 1. Input validation — every entry point, both tiers

- **Backend**: every command/query with input has a FluentValidation
  `AbstractValidator<T>`, executed by `ValidationBehavior` — handlers may assume valid
  input and must not re-implement checks. Validate lengths, ranges, formats, enum
  membership, and existence of referenced ids. Platform tier uses guard clauses /
  DataAnnotations (lighter by design) — but still validates every endpoint body.
- **Frontend**: zod schema per form (react-hook-form resolver) for UX; the server-side
  validator remains the source of truth. Never trust client-computed prices, totals,
  ids, or roles — recompute server-side (`PlaceOrderService` prices from the catalog
  lookup, never from the request).
- Reject unknown fields where practical; never bind request bodies straight into
  entities (DTO → mapping only).

## 2. Data access

- **EF Core parameterized queries only.** String-built SQL is forbidden; any
  `FromSqlRaw`-style usage must use parameter placeholders and carries a review flag.
- No secrets, connection strings, or tokens in code, comments, tests, or fixtures —
  env vars only (`.env.example` documents required keys; real `.env` is gitignored).
  Generate secrets with `openssl rand -base64 32`.
- Uploaded/media files are served from Payload with type checks; never trust
  client-declared MIME types.

## 3. AuthN / AuthZ

- Client API: JWT bearer (`Microsoft.AspNetCore.Authentication.JwtBearer`);
  authed endpoints (`wishlist`, `orders` history, dashboard) require a valid token;
  `sub` claim is the user identity (`ICurrentUser`). HTTPS metadata required outside
  Development. The dev fallback signing key in `Program.cs` must never reach a real
  deployment — set `Jwt:Key` (32+ bytes) via env.
- Frontend: Auth.js (NextAuth v5) Credentials + JWT sessions, `AUTH_SECRET` from env.
  Protected pages check the session server-side (page/layout level).
- factory-dashboard: single admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`; CI webhook
  authenticates via the `X-Webhook-Secret` header against `CI_WEBHOOK_SECRET` and
  returns 401 on absence/mismatch — shared-secret headers, not query params.
- New privileged actions default to **deny**: add the auth check before wiring the route.

## 4. Transport & headers — both tiers, keep them in sync

- Backend middleware and frontend `src/middleware.ts` both set:
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
  (camera/mic/geolocation off), `Strict-Transport-Security` (2y, includeSubDomains,
  preload). CSP is part of the backlog CSP-nonce pipeline — do not remove headers that
  exist; tighten, never loosen.
- CORS: explicit origins from config (`Cors:AllowedOrigins`) — never `*` with
  credentials.
- Rate limiting: public endpoints run under the fixed-window `public` policy
  (config-tunable). Every new public endpoint opts in. 429 on rejection.

## 5. Frontend-specific

- No `dangerouslySetInnerHTML` with non-CMS content; rich text renders through the
  sanctioned renderer (Payload richtext → React components), not raw HTML injection.
- Never expose server-only env vars to the client (`NEXT_PUBLIC_` prefix is the explicit
  opt-in); auth secrets and API-internal URLs stay server-side.
- Redirect targets must be validated (locale-aware navigation helpers only); no open
  redirects from query params.

## 6. Dependency & supply-chain policy (Dependabot triage)

The standing policy — a triage pass follows it and records outcomes in
`docs/SECURITY-TRIAGE.md`:

1. **Severity SLA**: critical/high alerts are fixed in the next working pass — upgrade
   when the fix is non-breaking (verified by the full suite); when genuinely breaking,
   pin + document the exposure, the reason, and the follow-up. Moderate/low are batched
   when safe (transitive bumps, patch/minor upgrades) or documented as deferred with
   rationale.
2. **Lockfiles are regenerated, never hand-edited**: delete `package-lock.json`
   (and `node_modules` for a truly clean resolution) and run `npm install`. `npm ci`
   must pass from the committed lockfile — a lockfile that needs `--legacy-peer-deps`
   is broken; fix the version set instead.
3. **Peer-supported combinations only**: choose versions whose peer ranges accept each
   other (e.g. Payload certifies specific Next lines). Do not silence ERESOLVE with
   force flags — that is how broken deploys are made.
4. **Never downgrade `net9.0` targets** or centrally-pinned .NET package majors to
   dodge an alert; .NET packages are checked with
   `dotnet list <sln> package --vulnerable --include-transitive`.
5. **Verification is part of the fix**: a dependency change is complete only when the
   full suite (backend, platform, bot, frontend lint/typecheck/unit/build/E2E both
   verticals, dashboard, verify-verticals, Lighthouse) is green.
6. npm `overrides` are the sanctioned tool for vulnerable **transitives** pinned by
   upstreams (scope them as narrowly as possible and note them in the triage doc).

## 7. Secrets & CI hygiene

- CI uses dummy env values (see `.github/workflows/ci.yml`) — never real secrets in
  workflow files; real deployment secrets live in the deployment environment only.
- Webhooks authenticate with shared-secret headers; tokens/secrets never appear in
  logs, error messages, or ProblemDetails bodies.
- The global exception handler returns sanitized ProblemDetails — no stack traces or
  connection strings to clients outside Development.

## 8. Security definition of done

- [ ] All inputs validated at the boundary (both tiers where applicable)
- [ ] AuthZ decided per endpoint/page — privileged actions deny by default
- [ ] No new raw SQL / raw HTML / unvalidated redirect / secret-in-code
- [ ] Headers, CORS, rate limits intact (or tightened, with note)
- [ ] `npm audit` (frontend + dashboard) and `dotnet list package --vulnerable` clean,
      or exceptions documented in `docs/SECURITY-TRIAGE.md`
- [ ] Full verification suite green
