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
| `dashboardSettings` | Settings module (Payload `siteSettings` global) |
| `analytics` | (existing flag) the overview analytics widget |

**Gating rule (§6):** a disabled flag makes the surface ABSENT — dashboard
routes 404 via `notFound()`, the nav derives without the item, the manage
endpoints are not mapped (404, absent from OpenAPI), the owner user is not
seeded. Proven by `scripts/verify-verticals.mjs` (dashboard nav derivation +
route-guard checks), `VerticalRoutingTests.Disabled_clientDashboard_removes_manage_routes`,
and `features/dashboard/lib/{access,nav}.test.ts`.

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
- **Backend bearer**: `lib/auth/backend-token.ts` mints a short-lived (10 min)
  HS256 JWT — claims `sub`/`email`/`role` — signed with `BACKEND_JWT_KEY`,
  which must equal the backend `Jwt:Key` (both default to the same dev-only
  fallback). The backend sets `RoleClaimType = "role"` and the
  `DashboardStaff` policy (`RequireRole("admin","owner","staff")` — admin is a
  superset, kept in lock-step with the frontend role model) guards
  `/api/v1/manage/*`.
- **User-management hardening** (adversarial-review findings, fixed): owners
  operate under a Where scope that excludes `admin` targets entirely (no
  reading, demoting, deleting or password-resetting the factory admin), owners
  cannot delete themselves, nobody may change their own role, and only trusted
  server-side writes (`overrideAccess` — seed/Local API) bypass the role
  validate so first-run bootstrap can create the admin.
- **Route guard** (`features/dashboard/lib/guards.ts`), enforced by the
  dashboard layout AND every dashboard page:
  1. flag off → `notFound()` (404 — before auth, an absent area stays absent)
  2. no session → redirect `/sign-in?callbackUrl=…` (callback validated
     against open redirects)
  3. no dashboard role, or staff on an owner-only page → `forbidden()`
     (real 403 via Next `experimental.authInterrupts`, `app/[locale]/forbidden.tsx`)

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
user is seeded from `DASHBOARD_OWNER_EMAIL`/`DASHBOARD_OWNER_PASSWORD`
(dev defaults documented in `.env.example`). Flag off ⇒ no owner user.

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
  when `clientDashboard=false` (temp manifest boot).
- **verify-verticals.mjs**: dashboard nav derivation (mirrors
  `features/dashboard/lib/nav.ts`), flag-off ⇒ empty nav, per-module flag
  removal, dashboard route files exist + call `requireDashboardAccess`.

## 6. Deliberate decisions & caveats

- **Local docker-compose** still points Payload at the shared `factory`
  database (pre-Phase-4 default). Payload's dev `push` manages the whole
  public schema, so prefer a dedicated Payload database when running the full
  stack (the CI job does: `payload_e2e`).
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
