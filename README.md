# Software Factory — Reusable Boilerplate (Phase 1: E-commerce)

A configuration-driven, full-stack boilerplate designed to be **cloned and extended**
into many client site verticals (e-commerce, corporate, portfolio, booking, LMS, real
estate, restaurant, healthcare, marketplace…). **Phase 1** implements the reusable
foundation with the **e-commerce** vertical as the reference implementation.

- **Backend** — .NET 9 / ASP.NET Core, **Clean Architecture** (4 layers), CQRS (MediatR),
  EF Core + PostgreSQL, Redis, OpenAPI-first.
- **Frontend** — Next.js 15 (App Router) + React 19, TypeScript, Tailwind + shadcn/ui,
  **feature-based** structure, Server Components by default.
- **CMS** — Payload CMS 3, embedded in the Next.js app (all section copy is editable).
- **Auth** — Auth.js (NextAuth v5), self-hosted, Credentials + JWT sessions.
- **i18n** — next-intl, Arabic/English with correct RTL/LTR.
- Everything is toggled by a single root **`options.json`**.

> The design contract every layer implements against lives in
> [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — read it first.

---

## 1. Quick start

### Prerequisites
- Docker + Docker Compose (the one-command path), **or** for manual dev:
  .NET 9 SDK, Node.js 20+, PostgreSQL 16, Redis 7.

### Run everything with Docker (recommended)
```bash
cp .env.example .env          # then edit secrets (AUTH_SECRET, PAYLOAD_SECRET, DB password…)
docker compose up --build
```
This starts **postgres**, **redis**, the **backend API**, and the **frontend**:
- Frontend → http://localhost:3000
- Backend API + Swagger → http://localhost:5080 (Swagger UI at `/swagger` in Development)
- Payload admin → http://localhost:3000/admin

`options.json` is mounted read-only into both the backend and frontend containers, so a
change to it re-shapes what each service registers on the next start.

### Run manually (two terminals)
```bash
# Backend
cd backend
dotnet restore
dotnet run --project src/SoftwareFactory.Api      # http://localhost:5080

# Frontend
cd frontend
npm install
npm run dev                                        # http://localhost:3000
```
Generate frontend API types from the backend contract (optional, OpenAPI-first):
```bash
# backend emits openapi.json in Development; then:
cd frontend && npm run gen:api
```

---

## 2. How `options.json` works (configuration-driven build)

The root [`options.json`](options.json) (validated by
[`options.schema.json`](options.schema.json)) is the single source of truth for **what
gets built and enabled**. Both sides read it at build/startup:

```jsonc
{
  "siteType": "ecommerce",        // which vertical (Phase 1 = ecommerce)
  "language": "ar-en",            // "ar" | "en" | "ar-en"
  "defaultDirection": "rtl",
  "payments": ["tamara", "tabi"],
  "integrations": ["zatca", "whatsapp"],
  "features": {                   // feature flags
    "reviews": false,             // OFF → no route, no nav, no seed — but code still exists
    "wishlist": true,
    "search": true,
    "orderTracking": true,
    "clientDashboard": true,
    "cms": true,
    "analytics": true
  },
  "sections": {                   // homepage sections + render order
    "hero":        { "enabled": true,  "order": 1 },
    "categories":  { "enabled": true,  "order": 3 },
    "reviews":     { "enabled": false, "order": 5 }
  }
}
```

- **Backend** (`OptionsManifest` + `FeatureManager`): each endpoint module is mapped in
  `Program.cs` **only when its flag/section is enabled**; `DbSeeder` seeds only enabled
  modules. Disabled = the endpoint 404s and is absent from OpenAPI (verify: `reviews`
  is off, so `/api/v1/reviews` is not in Swagger).
- **Frontend** (`src/lib/config/options.ts`): `getEnabledSections()` drives the homepage
  (rendered in `order`), nav items are filtered by `isFeatureEnabled(...)`, and pages
  `notFound()` when their flag is off.

**Feature-flag pattern, not deleted code:** turning a feature off never removes its module.
The code stays on disk and is simply not registered/rendered — flip the flag back on to
restore it.

---

## 3. Adding a new feature module (the reusable pattern)

Adding a feature = **adding new folders only**, never editing existing modules. Example: "Reviews".

### Backend (4 layers, vertical slice)
1. **Domain** — `src/SoftwareFactory.Domain/Modules/Reviews/Review.cs` (entity, value
   objects, domain events). Zero external dependencies.
2. **Application** — `src/SoftwareFactory.Application/Modules/Reviews/` with
   `Queries/`, `Commands/`, `Dtos/` (records), `Validators/` (FluentValidation),
   `EventHandlers/`. Declare any needed infra interface (e.g. `IReviewRepository`) here.
3. **Infrastructure** — `Persistence/Configurations/ReviewConfiguration.cs`,
   `Repositories/ReviewRepository.cs`; register in `DependencyInjection.cs`.
4. **Api** — `Modules/Reviews/ReviewsEndpoints.cs` exposing `MapReviews(this IEndpointRouteBuilder)`,
   guarded in `Program.cs` by `featureManager.IsFeatureEnabled("reviews")`. Endpoints only
   call `ISender.Send(...)`.
5. **Tests** — `tests/SoftwareFactory.Application.Tests/Modules/Reviews/…` (xUnit).

### Frontend (feature folder)
Create `frontend/src/features/reviews/` — self-contained:
```
reviews/
  components/     # Server Components by default; "use client" only on interactive leaves
  hooks/
  api/            # typed calls via src/lib/api/client.ts (routes from ARCHITECTURE.md)
  messages/       # en.json + ar.json fragment under a single namespace (no hardcoded copy)
  types.ts
  index.ts        # barrel: export the Section / mountable components
```
Then: merge the message fragment into `src/messages/{en,ar}.json`, add the page under
`src/app/[locale]/…`, and wire the homepage `Section` in
`src/components/home/HomeSections.tsx` (guarded by `isSectionEnabled(...)`).

### CMS (editable content)
Add a Payload collection/global in `frontend/src/payload/collections|globals/` and a typed
fetcher in `frontend/src/lib/cms/`. Localize editorial fields (`localized: true`).

> Flip `features.reviews` / `sections.reviews.enabled` to `true` in `options.json` to turn
> the finished module on.

---

## 4. Project structure

```
software-factory/
├─ options.json / options.schema.json      # configuration-driven build manifest
├─ docker-compose.yml                       # postgres + redis + backend + frontend
├─ docs/ARCHITECTURE.md                     # the shared contract (routes, DTOs, flags)
├─ .github/workflows/ci.yml                 # lint • unit • build • E2E • Lighthouse CI
├─ backend/                                 # .NET 9 — Clean Architecture
│  ├─ SoftwareFactory.sln
│  ├─ Directory.Build.props / .Packages.props
│  ├─ Dockerfile
│  ├─ src/
│  │  ├─ SoftwareFactory.Domain/            #  1. entities, VOs, domain events (no deps)
│  │  ├─ SoftwareFactory.Application/       #  2. CQRS use cases, DTOs, validators, interfaces
│  │  │   └─ Modules/{Catalog,Cart,Orders,Search,Wishlist,Reviews,Contact}/
│  │  ├─ SoftwareFactory.Infrastructure/    #  3. EF Core, repos, Redis, config, seed
│  │  └─ SoftwareFactory.Api/               #  4. Minimal API endpoint modules (no logic)
│  └─ tests/
│     ├─ SoftwareFactory.Application.Tests/ # xUnit use-case tests
│     └─ SoftwareFactory.IntegrationTests/  # Testcontainers (real Postgres)
└─ frontend/                                # Next.js 15 — feature-based
   ├─ src/
   │  ├─ app/[locale]/…                     # routes (home, products, cart, checkout,
   │  │                                     #   orders, search, wishlist, dashboard, sign-in…)
   │  ├─ app/(payload)/                     # Payload admin + REST/GraphQL route group
   │  ├─ features/<feature>/                # 13 self-contained features
   │  ├─ components/{ui,layout,providers,auth,home}/
   │  ├─ lib/{config,api,i18n,seo,auth,cms,utils}/
   │  ├─ messages/{ar,en}.json              # next-intl catalogs
   │  └─ payload/{collections,globals}/     # CMS schema
   ├─ payload.config.ts
   ├─ Dockerfile / next.config.ts / tailwind.config.ts
   ├─ vitest.config.ts / playwright.config.ts / lighthouserc.json
   └─ next-sitemap.config.js
```

---

## 5. Testing

```bash
# Backend
cd backend
dotnet test                       # xUnit unit tests (Application layer)
#   Integration tests use Testcontainers → require a running Docker engine.

# Frontend
cd frontend
npm run test:unit                 # Vitest + RTL
npm run test:e2e                  # Playwright (happy-path checkout flow)
```

---

## 6. CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on push/PR:
**backend** (build + unit + Testcontainers integration) · **frontend**
(lint + typecheck + unit + build) · **Playwright E2E** · **Lighthouse CI** with minimum
score thresholds enforced in `frontend/lighthouserc.json`.

---

## 7. Quality standards (built in from the start)

- **i18n / RTL** — next-intl ar/en, `<html dir>` per locale, hreflang + canonical.
- **SEO** — Metadata API (SSR/SSG), JSON-LD (Product, Organization, FAQPage), auto
  `sitemap.xml` + `robots.txt`, Open Graph.
- **Security** — FluentValidation + zod input validation, EF parameterized queries only,
  security headers (CSP/HSTS/X-Frame-Options/…) on both tiers, rate limiting on public API
  endpoints, secrets via env only, JWT auth.
- **Performance** — `next/image` (AVIF/WebP), code splitting, lazy below-the-fold, Redis
  caching for hot reads.
- **Responsive & a11y** — mobile-first Tailwind, semantic HTML, ARIA, visible focus,
  WCAG AA contrast.

---

## 8. Out of scope this pass (backlog — see `// TODO (backlog):` markers)

- Telegram bot / factory dashboard / client CRM
- Other site-type templates (LMS, real estate, restaurant, …)
- AI orchestration layer (multi-model routing)
- Multi-tenant / white-label logic
- Live payment capture (Tamara/Tabi widgets), ZATCA e-invoicing, WhatsApp notifications
  (interfaces are stubbed in the backend; wire the providers when in scope)

---

## 9. Environment variables

See [`.env.example`](.env.example). Never commit real secrets — everything is injected via
environment variables. Generate secrets with `openssl rand -base64 32`.
