# Backend Standards — .NET 9 / Clean Architecture

Binding for `backend/` (client product), `platform/` (control plane), and
`apps/factory-bot/`. The design contract is `docs/ARCHITECTURE.md` (+ `docs/PHASE2.md`
for verticals, `docs/PHASE3.md` for the platform tier); this document tells you how to
implement against it.

## 1. Solution shape (client backend)

Four projects, one dependency direction, root namespace `SoftwareFactory`:

```
backend/src/
  SoftwareFactory.Domain           # entities, value objects, domain events — ZERO external deps
  SoftwareFactory.Application      # CQRS use cases (MediatR), DTOs, validators, infra interfaces
  SoftwareFactory.Infrastructure   # EF Core (Npgsql), repositories, Redis, options manifest, seed, DI
  SoftwareFactory.Api              # Minimal API endpoint modules — NO business logic
backend/tests/
  SoftwareFactory.Application.Tests   # xUnit use-case tests (NSubstitute fakes)
  SoftwareFactory.IntegrationTests    # Testcontainers — real Postgres
  SoftwareFactory.VerticalRoutingTests# WebApplicationFactory boot-twice proof
```

- Dependencies point inward only: Api → Application → Domain; Infrastructure implements
  Application interfaces. Domain references **nothing** external — not even
  Microsoft.Extensions.*.
- Target framework is **net9.0** everywhere. Never downgrade a target framework or a
  centrally-pinned package to dodge a build error.
- Package versions live **only** in `Directory.Packages.props`
  (`ManagePackageVersionsCentrally`). Project files reference packages without versions.

## 2. Vertical-slice modules

Every capability is a self-contained module repeated across the layers —
`…/Modules/<ModuleName>/…` — never a giant `Services/` folder:

- **Domain**: `Modules/<Name>/<Entity>.cs` (+ value objects, domain events). Entities
  extend `Common/BaseEntity` (Guid id, timestamps); aggregates extend `AggregateRoot`
  and raise `IDomainEvent`s. Money is always the `Money(decimal Amount, string Currency)`
  value object — never a bare decimal.
- **Application**: `Modules/<Name>/{Queries,Commands,Dtos,Validators,EventHandlers}/`.
  Commands/queries implement `IRequest<T>`; handlers implement `IRequestHandler<,>`.
  DTOs are **records**. Every external need is an interface declared here
  (`I<Name>Repository`, `IUnitOfWork`, `ICacheService`, `ICurrentUser`,
  `IFeatureManager`) — Infrastructure implements it.
- **Infrastructure**: `Persistence/Configurations/<Entity>Configuration.cs` (one per
  entity), `Repositories/<Entity>Repository.cs`, registration in `DependencyInjection`.
  EF Core only — **parameterized queries always**; raw SQL requires an explicit review
  sign-off and must use parameters.
- **Api**: `Modules/<Name>/<Name>Endpoints.cs` exposing
  `Map<Name>(this IEndpointRouteBuilder)`. Endpoints do exactly three things: bind input,
  `ISender.Send(...)`, shape the HTTP response. Anything else belongs in Application.

### Cross-cutting pipeline (already wired — do not bypass)

`ValidationBehavior` (FluentValidation — every command/query with input has an
`AbstractValidator<T>`), `LoggingBehavior`, `CachingBehavior` (queries opt in via
`ICacheableQuery`; Redis). New cross-cutting concerns are new behaviors, not copy-pasted
handler code.

## 3. Configuration-driven registration (the factory's core trick)

- `OptionsManifest` (Infrastructure) loads the root `options.json`
  (env override `SF_OPTIONS_FILE`). `IFeatureManager` answers
  `IsFeatureEnabled("wishlist")`, `IsSectionEnabled("hero")`, `SiteType`,
  `IsVertical("restaurant")`.
- `Program.cs` maps a module's endpoints **only when** its siteType + feature/section
  flag allows it. A disabled module 404s and is absent from OpenAPI. `DbSeeder` seeds
  only enabled modules.
- **Feature-flag pattern, never delete**: code for disabled features stays on disk.
- Startup honors `SF_SKIP_DB_INIT=1` (skip migrate/seed) so `WebApplicationFactory`
  tests can boot without Postgres.

## 4. Shared/Core vs vertical-specific (Phase 2 rule)

> **Generic = the process** (cart → order → status timeline).
> **Vertical = the catalog it sells and the fulfillment it promises.**

- Shared ordering pipeline lives in `…/Shared/Ordering/` (Domain, Application, Api):
  `Cart`, `Order`, `Money`, `PlaceOrderService`, `/api/v1/cart/*`, `/api/v1/orders/*`.
  Line items reference a **generic `ItemId` (Guid)** with denormalized
  `NameEn/NameAr/Slug/ImageUrl/UnitPrice` — **no FK to Product or MenuItem**.
- The cart depends on `ICatalogItemLookup`; Infrastructure registers the vertical's
  implementation (`ProductCatalogItemLookup` / `MenuItemCatalogItemLookup`) by siteType.
  New verticals plug in here — do not fork the cart.
- `Order` carries optional owned VOs: `ShippingAddress?` (ecommerce) or `Fulfillment?`
  (restaurant). Exactly one is set. A new vertical adds its own fulfillment VO.
- **Wire-compat rule**: the shared DTO field stays `productId` even though Domain says
  `ItemId` — the Phase 1 REST contract is frozen. Changing a released route or DTO shape
  is a breaking contract change and needs an explicit decision, not a refactor.

## 5. REST conventions

- Base `/api/v1`, kebab/lowercase segments, module route sets exactly as listed in
  `docs/ARCHITECTURE.md` §2 and `docs/PHASE2.md` §3. `GET /health` always on.
- Public endpoints run under the `public` fixed-window rate-limit policy; authed
  endpoints require the JWT bearer scheme. New public endpoints must opt into rate
  limiting.
- Errors are RFC 7807 `ProblemDetails` via the global exception handler — handlers never
  catch-and-format their own error JSON. Validation failures → 400 with field errors.
- OpenAPI (Swashbuckle) must describe every mapped endpoint; the frontend generates its
  types from `openapi.json` (`npm run gen:api`).

## 6. Platform tier is intentionally lighter (`platform/`, `apps/factory-bot/`)

Internal tooling keeps the 4-layer **names** but drops the heavy machinery — this is a
standard, not an accident. **No MediatR, no pipeline behaviors, no domain events, no
Redis** in the platform. Plain service classes behind interfaces (`ProjectService` :
`IProjectService`), guard-clause/DataAnnotations validation, record DTOs, minimal
endpoints, EF InMemory for tests. The bot duplicates zero business logic — it calls the
Platform REST API through a typed `IPlatformApiClient`. Do not "upgrade" the platform to
the client stack, and do not let client code depend on platform code (or vice versa).

## 7. Testing standards

- **Unit (Application.Tests)**: one test class per use case; fake repositories with
  NSubstitute; assert behavior and raised events, not implementation details.
- **Integration (IntegrationTests)**: Testcontainers with real Postgres for repository
  behavior. Requires Docker; keep them isolated so unit tests still run without it.
- **Boot-twice proof (VerticalRoutingTests)**: any change to module registration or a
  new vertical must keep the WebApplicationFactory assertions true — ecommerce boot
  exposes `/api/v1/products*` and not `/menu*`; restaurant the reverse.
- Phase 1 test files are frozen fixtures for refactors: an extraction/refactor that
  forces an existing test file to change is prima facie a contract break.
- Every module ships with tests. A module PR without tests fails review.

## 8. Definition of done (backend)

`dotnet build -c Release` warning-clean for the touched solution;
`dotnet test backend/SoftwareFactory.sln`, `platform/SoftwareFactory.Platform.sln`,
`apps/factory-bot/FactoryBot.sln` green; OpenAPI regenerated if routes changed; flags in
`options.schema.json` updated when a new feature/section key is introduced; security
standards (`security-standards.md`) applied; docs contract updated when shapes changed.
