# Deployment runbook

## Required secrets — boot fails without these

Outside `Development` (`ASPNETCORE_ENVIRONMENT` anything else, including
Staging), the backend **refuses to boot** unless `Jwt__Key` (32+ bytes),
`Jwt__Issuer` and `Jwt__Audience` are set to real, deployment-specific values —
the committed dev constants and short keys are explicitly rejected at startup
(`Api/Identity/JwtStartupValidation.cs`, pinned by `ProductionJwtBootTests`).
The frontend production build (any `next start`, including the compose and
standalone images — Next inlines `NODE_ENV=production` at build time) **refuses
to mint dashboard bearers** unless `BACKEND_JWT_KEY` is set, and it must equal
`Jwt__Key` byte-for-byte, with `BACKEND_JWT_ISSUER`/`BACKEND_JWT_AUDIENCE`
matching `Jwt__Issuer`/`Jwt__Audience` (mismatch ⇒ every `/api/v1/manage/*`
call is rejected 401). Seeding never defaults credentials: `npm run
payload:seed` **skips** the factory-admin account without
`PAYLOAD_ADMIN_PASSWORD` and the store-owner account without
`DASHBOARD_OWNER_PASSWORD` (loud log, error-level in production; set the var
and re-run to create the missing account). `AUTH_SECRET` (Auth.js) and
`PAYLOAD_SECRET` (Payload CMS) are likewise mandatory in production — Auth.js
and Payload fail at first use without them. Generate every secret with
`openssl rand -base64 32`.

## 1. Environment matrix

| Variable | Consumer | `Development` / `next dev` | Outside `Development` / production build |
|---|---|---|---|
| `Jwt__Key` | backend | optional (dev fallback) | **required, 32+ bytes — boot fails**; dev constant rejected |
| `Jwt__Issuer` | backend | optional (dev json sets it) | **required — boot fails**; dev constant rejected |
| `Jwt__Audience` | backend | optional (dev json sets it) | **required — boot fails**; dev constant rejected |
| `BACKEND_JWT_KEY` | frontend | optional (dev fallback) | **required — minting throws**; must equal `Jwt__Key` |
| `BACKEND_JWT_ISSUER` | frontend | optional | must equal `Jwt__Issuer` (else backend rejects bearers) |
| `BACKEND_JWT_AUDIENCE` | frontend | optional | must equal `Jwt__Audience` (else backend rejects bearers) |
| `AUTH_SECRET` | frontend (Auth.js) | recommended | **required** — sessions fail without it |
| `PAYLOAD_SECRET` | frontend (Payload) | required | **required** — Payload init fails |
| `DATABASE_URI` | frontend (Payload) | required for CMS/dashboard | required |
| `ConnectionStrings__Postgres` / `__Redis` | backend | required for data paths | required |
| `PAYLOAD_ADMIN_PASSWORD` | `payload:seed` | unset ⇒ admin **skipped** (warn) | unset ⇒ admin **skipped** (error log) |
| `DASHBOARD_OWNER_PASSWORD` | `payload:seed` | unset ⇒ owner **skipped** (warn) | unset ⇒ owner **skipped** (error log) |

Pairing rule: `BACKEND_JWT_KEY == Jwt__Key`, `BACKEND_JWT_ISSUER ==
Jwt__Issuer`, `BACKEND_JWT_AUDIENCE == Jwt__Audience`. One value per
deployment, set on both sides. The full annotated list lives in
[`.env.example`](../.env.example) (stack) and
[`frontend/.env.example`](../frontend/.env.example) (frontend-only view).

## 2. Docker compose (local full stack)

`cp .env.example .env`, fill the secrets, `docker compose up --build`. The
compose backend defaults to `ASPNETCORE_ENVIRONMENT=Development`, so it boots
with the dev JWT fallback — but the compose **frontend is a production `next
build`**, so using `/dashboard` there requires the `BACKEND_JWT_KEY`/`Jwt__Key`
pair in `.env` (runtime `NODE_ENV` cannot relax it; see docs/PHASE4.md §6).
Setting `ASPNETCORE_ENVIRONMENT` to anything else flips the backend into the
fail-closed contract above — expect a crash-loop until the `Jwt__*` trio is set.

## 3. Seeding accounts and content

```bash
cd frontend
PAYLOAD_ADMIN_PASSWORD=... DASHBOARD_OWNER_PASSWORD=... npm run payload:seed
```

- Idempotent; content seeds only for sections/features enabled in the manifest.
- Admin is created only when **no admin-role user exists**; owner (gated by
  `features.clientDashboard`) only when its email is absent — so re-running
  after setting a previously missing password creates just the missing account.
- The seed never invents or defaults a password. A skipped account is a loud
  log line naming the exact env var to set.

## 4. CI secrets checklist

The **CI pipeline itself needs no repository secrets today** — every job runs
hermetically with inline dummy values (`ci_dummy_*`, throwaway seed password
for the ephemeral compose database). Do not add real secrets to `ci.yml`.

A real deploy pipeline (when one is added — deploys are a human gate, §10 of
the engineering skill/ARCHITECTURE) must provide, per environment (GitHub
Environments → secrets, never committed):

- [ ] `Jwt__Key` + `BACKEND_JWT_KEY` — same 32+ byte value (`openssl rand -base64 32`)
- [ ] `Jwt__Issuer` + `BACKEND_JWT_ISSUER` — same deployment-specific value
- [ ] `Jwt__Audience` + `BACKEND_JWT_AUDIENCE` — same deployment-specific value
- [ ] `AUTH_SECRET`
- [ ] `PAYLOAD_SECRET`
- [ ] `POSTGRES_PASSWORD` → `ConnectionStrings__Postgres` (backend) + `DATABASE_URI` (Payload)
- [ ] `PAYLOAD_ADMIN_PASSWORD` — or accept that the seed skips the admin
- [ ] `DASHBOARD_OWNER_PASSWORD` — required for a client handover (owner sign-in)
- [ ] `CI_WEBHOOK_SECRET` — internal tooling only (factory-dashboard CI webhook)
- [ ] Payment/integration keys as enabled by the manifest (Tamara/Tabby/ZATCA/WhatsApp — NoOp without them)

Boot-time verification is automatic: a misconfigured backend exits with an
`InvalidOperationException` naming the missing/rejected `Jwt:*` value, and the
frontend surfaces a mint-time error naming `BACKEND_JWT_KEY`. Treat either as a
blocked deploy, not something to work around.
