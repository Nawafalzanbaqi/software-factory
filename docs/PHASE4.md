# Phase 4 — Client Dashboard (contract)

Phase 4 turns the Phase-1 `/dashboard` stub into the **real client-facing
dashboard**: the surface a client uses to run their site after handover.
It is part of the client product (`backend/` + `frontend/`), fully gated by
`options.json`, and additive — the Phase 1/2 REST contract and frozen tests are
unchanged.

## 0. Flags (options.json → features)

| Flag | Gates |
|------|-------|
| `clientDashboard` | master switch: every `/dashboard` route, the dashboard nav item, the backend `/api/v1/manage/*` endpoints, the seeded owner user |
| `dashboardOrders` | Orders module (list / detail / status transitions) |
| `dashboardCatalog` | Catalog module (products or menu items by `siteType`) |
| `dashboardContent` | Content module (requires `cms` too) |
| `dashboardUsers` | Users & roles module (owner only) |
| `dashboardSettings` | Settings module (Payload `siteSettings` global; owner only) |
| `analytics` | (existing flag) the overview analytics widget |

**Gating rule (§6):** a disabled flag makes the surface ABSENT — dashboard
routes 404 via `notFound()`, the nav derives without the item, the manage
endpoints are not mapped (404, absent from OpenAPI), the owner user is not
seeded, **and the Payload REST surface is denied**: `/api/users` and
`/api/globals/siteSettings` access rules read the manifest
(`src/payload/manifest-flags.ts`) and deny owner/staff whenever
`clientDashboard` or the module flag is off (the factory-operator `admin`
path is never gated) — security audit fix #3. Proven by
`scripts/verify-verticals.mjs` (dashboard nav + REST-surface derivation +
route/access lock-step checks),
`VerticalRoutingTests.Disabled_clientDashboard_removes_manage_routes`,
`features/dashboard/lib/{access,nav}.test.ts`, and
`src/payload/dashboard-rest-gating.test.ts`.

## 1. Roles & auth

- The **Payload `users` collection is the user store**: `role` ∈
  `admin` (factory operator) · `owner` (the client) · `staff` (client's team).
  Field-level access: only admins/owners manage roles; only an admin can
  assign `admin` (privilege-escalation validate). Owners/staff manage content
  in the Payload admin; the collection's CRUD access rules encode who may
  touch users.
- **Auth.js Credentials** (`lib/auth/config.ts`) validates against Payload's
  Local API login — completing the Phase-1 stub TODO (the documented
  `/auth/login` backend endpoint was never built; ARCHITECTURE.md §4 already
  designates the frontend as the token issuer). The JWT session carries
  `role` and `payloadToken` (for authed Payload REST calls).
- **Backend bearer**: `lib/auth/backend-token.ts` mints a short-lived HS256
  JWT — claims `sub`/`email`/`role` — signed with `BACKEND_JWT_KEY`, which
  must equal the backend `Jwt:Key`. The backend sets `RoleClaimType = "role"`
  and the `DashboardStaff` policy (`RequireRole("admin","owner","staff")` —
  admin is a superset, kept in lock-step with the frontend role model) guards
  `/api/v1/manage/*`.
  - **Lifetime = 2 minutes** (audit fix #6, decided 2026-07-03): tokens are
    minted per request by `getAccessToken()` and never cached, so shortening
    from 10 min costs nothing and shrinks the replay window (JwtBearer's
    default 5-min clock skew still applies on top).
  - **FAIL-CLOSED key policy** (audit fix #1): the shared dev-only constants
    exist ONLY for Development/`next dev`. Under `NODE_ENV=production` the
    frontend throws instead of minting without `BACKEND_JWT_KEY`; outside
    `Development` the backend **refuses to boot** unless `Jwt:Key` (32+
    bytes), `Jwt:Issuer` and `Jwt:Audience` are set to real values — the
    committed dev constants are explicitly rejected, and issuer/audience
    validation is always enforced (`Api/Identity/JwtStartupValidation.cs`,
    pinned by `ProductionJwtBootTests`).
- **User-management hardening** (adversarial-review findings, fixed): owners
  operate under a Where scope that excludes `admin` targets entirely (no
  reading, demoting, deleting or password-resetting the factory admin), owners
  cannot delete themselves, nobody may change their own role, and only trusted
  server-side writes (`overrideAccess` — seed/Local API) bypass the role
  validate so first-run bootstrap can create the admin.
- **Settings is owner-scoped** (audit fix #4): staff manage content and
  orders, not site settings — `canEditSettings` allows admin/owner only, the
  settings page guard passes `ownerOnly: true`, and the nav hides the item
  from staff. `supportEmail`/`supportPhone` therefore stay owner-only too.
- **Route guard** (`features/dashboard/lib/guards.ts`), enforced by the
  dashboard layout AND every dashboard page:
  1. flag off → `notFound()` (404 — before auth, an absent area stays absent)
  2. no session → redirect `/sign-in?callbackUrl=…` (callback validated by the
     structural open-redirect guard `lib/auth/callback-url.ts` — rejects
     absolute/protocol-relative URLs AND backslash smuggling like
     `/\evil.com`; audit fix #5)
  3. no dashboard role, or staff on an owner-only page (users, settings) →
     `forbidden()` (real 403 via Next `experimental.authInterrupts`,
     `app/[locale]/forbidden.tsx`)

## 2. Backend — Shared/Ordering manage slice (additive)

New Application slice `Shared/Ordering/Orders/Manage` reusing the existing
domain (`Order.TransitionTo`, `OrderDto`, `OrderRepository`) — no ordering
logic duplicated:

```
GET  /api/v1/manage/orders?page=&pageSize=&status=   → PagedResult<OrderDto>   (DashboardStaff)
GET  /api/v1/manage/orders/{orderNumber}             → ManagedOrderDto         (DashboardStaff)
POST /api/v1/manage/orders/{orderNumber}/status      → ManagedOrderDto         (DashboardStaff)
     body: { status }  — an OrderStatus NAME (Pending|Paid|Processing|Shipped|Delivered|Cancelled)
```

`ManagedOrderDto` (new, additive) = OrderDto fields + customer
(name/email/phone), paymentMethod, timeline, and the fulfillment pair
(`shippingAddress` XOR `fulfillment`). `IOrderRepository` gains
`GetPagedAsync(page, pageSize, status?)`. Endpoints are `Produces<T>`-typed so
`npm run gen:api` emits their schemas.

## 3. Frontend — module map

```
features/dashboard/            shell: guards (requireDashboardAccess), nav, DashboardShell
features/dashboard-orders/     backend manage API (generated OpenAPI types), table/detail,
                               zero-JS status transition via a server action
features/dashboard-catalog/    vertical-aware (getSiteType → products|menuItems),
                               browser-side Payload REST with `Authorization: JWT <payloadToken>`
features/dashboard-content/    options-driven deep links into /admin (raw <a> — unlocalized area)
features/dashboard-analytics/  IAnalyticsProvider + NoOpAnalyticsProvider (§9 NoOp rule)
                               // TODO(phase-6): UmamiAnalyticsProvider
features/dashboard-users/      owner-only Payload users CRUD (owner assigns owner|staff only)
features/dashboard-settings/   Payload `siteSettings` global (new), REST-edited
```

Routes: `app/[locale]/dashboard/{,orders,orders/[orderNumber],catalog,content,users,settings}` —
all `force-dynamic`, `noIndex`, ar/en with logical-property (RTL-safe) styling.

Types for backend data **derive from the generated OpenAPI contract**
(`src/lib/api/openapi.ts`, committed output of `npm run gen:api`); Payload doc
types derive from generated `src/payload-types.ts` (`npm run generate:types`).
The Phase-1 hand-written `PagedResult.total` (never consumed; the backend has
always serialized `totalCount`) was corrected to the generated shape — the
Phase-3 lesson applied.

## 4. Seeding

`npm run payload:seed` (new runner `src/payload/seed.run.ts`): the bootstrap
admin now gets `role: "admin"`; when `clientDashboard` is on, a `role: "owner"`
user is seeded from `DASHBOARD_OWNER_EMAIL`/`DASHBOARD_OWNER_PASSWORD`.
Flag off ⇒ no owner user. **Passwords are never defaulted** (audit fix #2):
`PAYLOAD_ADMIN_PASSWORD`/`DASHBOARD_OWNER_PASSWORD` unset ⇒ that account is
SKIPPED with a loud log (error-level in production) — no repo-known credential
can ever be seeded. Set the vars (see `.env.example`) and re-run the seed to
create the account; the `e2e-dashboard-real` CI job sets a CI-scoped
throwaway value for its ephemeral database.

## 5. Verification added in Phase 4

- **Vitest**: access-decision matrix (404/sign-in/403/ok), nav gating per
  manifest + flag-off variants, role-escalation validate, NoOp provider.
- **Playwright (mock, ecommerce e2e job)** `e2e/dashboard.spec.ts`: real
  session cookies (minted with the server's AUTH_SECRET), guest→sign-in,
  role-less→403, staff nav gating, owner catalog edit → storefront reflects
  (in-process stub backend on :5080; Payload REST via page.route).
- **Playwright (real backend, own CI job `e2e-dashboard-real`)**
  `e2e/dashboard-real.spec.ts`: docker-compose postgres+redis+backend, Payload
  on its own database (`payload_e2e` — dev push must not touch EF tables),
  `payload:seed`, then UNMOCKED sign-in → orders list → order detail → status
  transition.
- **VerticalRoutingTests**: manage routes present for both verticals, absent
  when `clientDashboard=false` (temp manifest boot); **ProductionJwtBootTests**
  (audit fix #1): outside Development the boot FAILS without a real
  `Jwt:Key`/`Issuer`/`Audience`, rejects the committed dev constants and short
  keys, and still succeeds with real values.
- **verify-verticals.mjs**: dashboard nav derivation (mirrors
  `features/dashboard/lib/nav.ts`), flag-off ⇒ empty nav, per-module flag
  removal, dashboard route files exist + call `requireDashboardAccess`
  (owner-only pages pass `ownerOnly: true`), and the Payload REST surface
  derivation (fix #3/#4): owner allowed with flags on, owner/staff denied with
  flags off, staff never on users/settings, access files carry the manifest
  gate.
- **Vitest (audit fixes)**: `src/payload/dashboard-rest-gating.test.ts` (the
  real Users/SiteSettings access rules per manifest variant, incl. the
  no-manifest fail-closed fallback), `lib/auth/callback-url.test.ts`
  (open-redirect guard incl. backslash and normalization bypasses),
  `lib/auth/backend-token.test.ts` (production mint throws without
  `BACKEND_JWT_KEY`; 2-minute lifetime), and `src/payload/seed.test.ts`
  (no-default password policy + the re-run recovery path).

## 6. Deliberate decisions & caveats

- **Local docker-compose** still points Payload at the shared `factory`
  database (pre-Phase-4 default). Payload's dev `push` manages the whole
  public schema, so prefer a dedicated Payload database when running the full
  stack (the CI job does: `payload_e2e`).
- **Compose + dashboard bearers** (consequence of audit fix #1): the compose
  frontend image is a production `next build` — Next inlines
  `NODE_ENV="production"` at build time, so the container's runtime `NODE_ENV`
  env cannot relax the fail-closed mint. Using `/dashboard` against the
  compose stack therefore REQUIRES setting the `BACKEND_JWT_KEY`/`Jwt__Key`
  pair in `.env` (the compose backend runs `Development`, so its issuer/
  audience stay the dev constants and only the key pair is needed). `next dev`
  outside compose keeps the zero-config dev fallback.
- **Manifest-unreadable fallback divergence** (accepted, deliberate): if NO
  options.json is readable, route gating falls back to the bundled default
  manifest (pages render) while the Payload REST gate treats it as "no flags"
  and denies owner/staff — matching the backend feature manager, which maps an
  unreadable manifest to zero features. For an authorization gate,
  deny-vs-broken-UI is the safe direction; mount the manifest to restore both.
- Payload tokens expire (~2 h) independently of the Auth.js session (30 d);
  dashboard Payload calls then 401 and the UI asks to sign in again.
  TODO(phase-5): silent Payload token refresh.
- The old customer-account stub cards (orders/wishlist links) were replaced by
  the client dashboard per the Phase 4 brief; customer sign-in never worked in
  Phase 1–3 (the stub posted to a nonexistent endpoint), so no user-facing
  regression exists.

## 7. Out of scope (// TODO(phase-5))

Remaining verticals · real integrations (payments, ZATCA, WhatsApp, Umami) ·
multi-tenant / white-label.
