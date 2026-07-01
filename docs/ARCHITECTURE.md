# Software Factory — Architecture Contract (Phase 1: E-commerce)

This document is the **shared contract** every layer implements against. Backend and
frontend agents MUST follow the names, routes and shapes here so the pieces fit together.

## 0. Configuration-driven build

Root `options.json` (schema: `options.schema.json`) drives what is built/enabled.

- **Backend** reads it at startup (`OptionsManifest` loaded in `Program.cs`) and only
  registers a module's endpoints + seed data when its feature/section flag is on. Code
  for disabled modules still exists — it is only conditionally *registered* (feature-flag
  pattern, never deleted).
- **Frontend** reads it at build/runtime via `src/lib/config/options.ts` and conditionally
  renders nav items, routes and homepage sections (ordered by `sections[x].order`).
- Feature → flag mapping: `features.reviews`, `features.wishlist`, `features.search`,
  `features.orderTracking`, `features.clientDashboard`, `features.cms`, `features.analytics`.

## 1. Modules (vertical slices)

Each is a self-contained module across all layers. Adding a module = new folders only,
never editing existing ones.

| Module          | Backend? | Frontend feature | Payload collection | Notes |
|-----------------|----------|------------------|--------------------|-------|
| Hero            | content via CMS | `hero` | `hero` (global) | CMS-driven copy |
| Categories      | yes      | `categories`     | `categories`       | |
| Products (Listing+Detail) | yes | `products` | `products` | core reference module |
| Cart            | yes      | `cart`           | —                  | session/user cart |
| Checkout        | yes      | `checkout`       | —                  | creates Order |
| Orders / Tracking | yes    | `orders`         | —                  | `features.orderTracking` |
| Search          | yes      | `search`         | —                  | `features.search` |
| Wishlist        | yes      | `wishlist`       | —                  | `features.wishlist` |
| Reviews         | yes      | `reviews`        | `reviews`          | `features.reviews` (OFF by default) |
| FAQ             | content  | `faq`            | `faq`              | CMS-driven |
| PromoBanners    | content  | `promo-banners`  | `promoBanners`     | CMS-driven |
| About           | content  | `about`          | `about` (global)   | CMS-driven |
| Contact         | yes      | `contact`        | `contact` (global) | form submit endpoint |
| Footer          | content  | `footer`         | `footer` (global)  | CMS-driven |

## 2. Backend — Clean Architecture, 4 projects

```
backend/src/
  SoftwareFactory.Domain/           # entities, value objects, domain events. ZERO external deps.
  SoftwareFactory.Application/       # CQRS (MediatR), DTOs, FluentValidation, infra interfaces
  SoftwareFactory.Infrastructure/   # EF Core (Npgsql), repositories, Redis, config, DI
  SoftwareFactory.Api/              # Minimal API endpoint modules only. No business logic.
backend/tests/
  SoftwareFactory.Application.Tests/     # xUnit use-case unit tests
  SoftwareFactory.IntegrationTests/      # Testcontainers (real Postgres)
```

Root namespace: `SoftwareFactory`. Each layer uses feature folders:
`.../Modules/<ModuleName>/...` — NOT one giant Services folder.

### Domain conventions
- `Common/BaseEntity.cs` (Guid Id, timestamps), `AggregateRoot` (domain events),
  `ValueObject`, `IDomainEvent`.
- Money value object: `Money(decimal Amount, string Currency)`.
- Entities: `Product`, `Category`, `ProductImage`, `Cart`, `CartItem`, `Order`,
  `OrderItem`, `Review`, `WishlistItem`, `ContactMessage`.

### Application conventions (CQRS)
- One folder per module: `Modules/Catalog/Products/{Queries,Commands,Dtos,Validators,EventHandlers}`.
- Commands/Queries implement `IRequest<TResponse>`; handlers `IRequestHandler<,>`.
- Pipeline behaviors: `ValidationBehavior` (FluentValidation), `LoggingBehavior`,
  `CachingBehavior` (Redis, for queries marked `ICacheableQuery`).
- Infra interfaces live here: `IProductRepository`, `ICartRepository`, `IOrderRepository`,
  `IUnitOfWork`, `ICacheService`, `ICurrentUser`, `IFeatureManager`.
- DTOs are records. Validators are FluentValidation `AbstractValidator<T>`.

### Infrastructure
- `AppDbContext` (Npgsql), EF configurations per entity in
  `Persistence/Configurations/<Entity>Configuration.cs`. **Parameterized queries only** (EF).
- `Repositories/<Entity>Repository.cs`. `Caching/RedisCacheService.cs`.
- `Configuration/OptionsManifest.cs` (+ `FeatureManager`) reads root `options.json`.
- `Seed/DbSeeder.cs` seeds only enabled modules.
- `DependencyInjection.cs` `AddInfrastructure(config)`.

### Api (Presentation)
- `Program.cs` wires: OpenAPI (Swashbuckle) → emits `openapi.json`, CORS, rate limiting,
  security headers, exception handling, MediatR, health checks.
- Endpoint modules: `Modules/<Module>/<Module>Endpoints.cs` exposing
  `IEndpointRouteBuilder.Map<Module>()`; each guarded by `IFeatureManager` before mapping.
- Route base: `/api/v1`. Endpoints call `ISender.Send(...)` only.

### REST contract (must match frontend api clients)
```
GET    /api/v1/categories
GET    /api/v1/products?category=&search=&page=&pageSize=&sort=
GET    /api/v1/products/{slug}
POST   /api/v1/cart/items            { productId, quantity }
GET    /api/v1/cart/{cartId}
PUT    /api/v1/cart/items/{itemId}   { quantity }
DELETE /api/v1/cart/items/{itemId}
POST   /api/v1/checkout              { cartId, customer, shippingAddress, paymentMethod }
GET    /api/v1/orders/{orderNumber}/track
GET    /api/v1/search?q=
GET    /api/v1/wishlist              (auth)
POST   /api/v1/wishlist/items        { productId }
DELETE /api/v1/wishlist/items/{productId}
GET    /api/v1/reviews/{productId}   (feature-flagged)
POST   /api/v1/reviews               (feature-flagged)
POST   /api/v1/contact               { name, email, message }
GET    /health
```

### DTO shapes (shared with frontend types)
```
ProductDto      { id, slug, nameEn, nameAr, descriptionEn, descriptionAr, price, currency,
                  compareAtPrice?, categoryId, images: string[], inStock, rating?, tags: string[] }
CategoryDto     { id, slug, nameEn, nameAr, imageUrl?, productCount }
CartDto         { id, items: CartItemDto[], subtotal, currency }
CartItemDto     { id, productId, slug, nameEn, nameAr, price, quantity, imageUrl, lineTotal }
OrderDto        { orderNumber, status, items: OrderItemDto[], total, currency, placedAt }
OrderTrackingDto{ orderNumber, status, timeline: { status, at }[] }
ReviewDto       { id, productId, author, rating, title, body, createdAt }
```

## 3. Frontend — Next.js 15 App Router, feature-based

```
frontend/src/
  app/
    [locale]/                 # ar | en, RTL/LTR resolved from locale
      layout.tsx              # <html dir>, next-intl provider, metadata
      page.tsx                # homepage: renders enabled sections in order
      products/page.tsx       # listing (SSG/ISR)
      products/[slug]/page.tsx# detail (generateMetadata + JSON-LD Product)
      cart/page.tsx
      checkout/page.tsx
      orders/[orderNumber]/page.tsx
      search/page.tsx
      ...
    (payload)/                # Payload admin route group
    api/                      # route handlers (auth, payload)
    sitemap.ts  robots.ts
  features/<feature>/         # self-contained: components/ hooks/ api/ types.ts index.ts
  components/ui/              # shadcn/ui shared kit
  components/layout/          # Header, Footer, LocaleSwitcher, Nav (config-driven)
  lib/
    config/options.ts        # loads root options.json (server) + typed accessors
    api/client.ts            # fetch wrapper -> backend /api/v1 (typed)
    i18n/                    # next-intl request config, routing, locales
    seo/                    # jsonld builders, metadata helpers
  messages/{ar,en}.json      # next-intl catalogs
  payload/collections/       # Payload collections (see table §1)
  payload.config.ts
```

- Server Components by default; `"use client"` only on interactive leaves
  (cart button, quantity stepper, locale switcher, forms, carousel).
- Design tokens in `tailwind.config.ts` + `app/globals.css` (CSS vars, `premium` theme).
- i18n: `next-intl`, locales `['ar','en']`, RTL for `ar`. `hreflang` + canonical in metadata.
- SEO: Metadata API, JSON-LD (Product, Organization), `next-sitemap`/`sitemap.ts`, robots, OG.
- All section copy comes from Payload (CMS) or messages — never hardcoded in components.
- API clients in each feature call `lib/api/client.ts` against the REST contract above.

## 4. Auth
Auth.js (NextAuth) v5, self-hosted, Credentials + optional OAuth, JWT sessions, `AUTH_SECRET`.
Wishlist/orders/dashboard require session. Backend trusts a bearer/JWT for authed endpoints
(Phase 1: validate `sub`/email claim; wire real JWT validation TODO noted).

## 5. Quality bars (build in from start)
Security headers (CSP/HSTS/X-Frame-Options), rate limiting on public endpoints, input
validation on every endpoint (FluentValidation + zod on forms), parameterized queries only,
secrets via env only, Redis caching for hot reads, next/image (AVIF/WebP), code splitting,
lazy below-the-fold, mobile-first, semantic HTML + ARIA + visible focus + WCAG AA contrast.

## 6. Out of scope (leave TODO comments referencing these — do not build)
Telegram bot / factory dashboard / client CRM · other verticals (LMS, realestate, etc.) ·
AI orchestration layer · multi-tenant / white-label.
