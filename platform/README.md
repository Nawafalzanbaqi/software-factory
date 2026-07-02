# SoftwareFactory.Platform — Factory Control Plane (Phase 3)

Internal tooling used to **run the factory** (clients, projects, the 7-phase pipeline, the 3 human
approval gates, API-cost tracking, and deployment events). It is **additive** and independent of the
client product under `backend/` — nothing there is referenced or modified.

## "Lighter-weight" decision (per PHASE3.md §0)

Same 4-layer Clean Architecture **names** as the client backend (Domain / Application /
Infrastructure / Api) for familiarity, but **intentionally lighter** because this is admin tooling,
not the product:

- **No MediatR / pipeline behaviors / domain events / Redis.** Application logic is plain
  **service classes** (`ClientService`, `ProjectService`, …) behind interfaces.
- **Light validation inline** (guard clauses), not FluentValidation.
- **Record DTOs**, minimal API endpoints — small and obvious.
- **EF Core + Npgsql** for the API; **EF Core InMemory** for unit tests (no Docker / Testcontainers).
- Analytics uses the client backend's **NoOp provider pattern**: `IAnalyticsProvider` +
  `NoOpAnalyticsProvider` (returns zeros + `provider:"noop"`). Real Umami is `// TODO(phase-4)`.

## Layout

```
src/SoftwareFactory.Platform.Domain          entities + enums (zero external deps)
src/SoftwareFactory.Platform.Application      service interfaces + impls, DTOs, repo interfaces, IAnalyticsProvider
src/SoftwareFactory.Platform.Infrastructure   EF Core DbContext, repositories, NoOpAnalyticsProvider, DI, migration, seeder
src/SoftwareFactory.Platform.Api              Minimal API (thin endpoints), Program.cs
tests/SoftwareFactory.Platform.Application.Tests   xUnit use-case tests (EF InMemory)
```

## Run / build / test (requires the .NET 9 SDK)

```bash
dotnet build platform/SoftwareFactory.Platform.sln -c Release
dotnet test  platform/SoftwareFactory.Platform.sln -c Release
dotnet run   --project platform/src/SoftwareFactory.Platform.Api   # http://localhost:5090
```

## Configuration (env only — no secrets in source)

- `PLATFORM_DB_CONNECTION` (or `ConnectionStrings:Platform`) — Postgres connection string.
- `PLATFORM_SKIP_DB_INIT=1` — skip startup migrate/seed (used by tests / CI).
- `ASPNETCORE_URLS` — overrides the default `http://localhost:5090`.

## REST API

All routes from PHASE3.md §1 are implemented (`/health`, `/api/clients*`, `/api/projects*`
including `PATCH /phase`, `/approvals`, `/usage`, `/deployments`, the `GET /api/deployments?since=`
bot outbox feed, and the NoOp `GET /api/analytics/{projectId}`). Enums serialize as strings
(`"ci"`, `"manual"`, `"intake"`, …). Errors are RFC7807 ProblemDetails; security headers +
localhost-only CORS are applied.

`// TODO(phase-4)`: real admin authn/z, multi-tenant / white-label, real Umami/LiteLLM analytics.
