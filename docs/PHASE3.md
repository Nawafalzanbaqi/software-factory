# Phase 3 — Factory Control Plane (contract)

Phase 3 is the **internal tooling used to run the factory** — NOT another client vertical and
NOT gated by `options.json`. It is **additive**: it must not modify anything under
`backend/src/SoftwareFactory.{Domain,Application,Infrastructure,Api}`. New top-level dirs only:
`platform/` (a .NET solution) and `apps/` (dashboard + bot).

## 0. "Lighter-weight" decision (document in README)

The client backend is a full DDD/CQRS product. The platform is **internal tooling**, so it is
**intentionally lighter** — do NOT over-engineer:
- Same 4-layer Clean Architecture **names** (Domain/Application/Infrastructure/Api) for
  familiarity, but **no MediatR / pipeline behaviors / domain events / Redis**. Application
  logic is plain **application service classes** (e.g. `ProjectService`) behind interfaces.
- EF Core + Npgsql for the API; **EF Core InMemory provider** for unit tests (no Docker /
  Testcontainers needed — this is admin tooling, not the product).
- Light validation inline (guard clauses / DataAnnotations), not FluentValidation.
- Record DTOs, minimal endpoints. Keep it small and obvious.
- Mirror the client backend's **NoOp provider pattern** (`NoOpPaymentGateway`/`NoOpEInvoiceService`)
  for analytics: `IAnalyticsProvider` + `NoOpAnalyticsProvider` (real Umami is `// TODO(phase-4)`).

## 1. platform/ — SoftwareFactory.Platform.* (.NET 9)

```
platform/
  SoftwareFactory.Platform.sln
  src/
    SoftwareFactory.Platform.Domain/          # entities + enums (no external deps)
    SoftwareFactory.Platform.Application/      # service interfaces + impls, DTOs, IAnalyticsProvider, repo interfaces
    SoftwareFactory.Platform.Infrastructure/   # EF Core (Npgsql) DbContext, repositories, NoOpAnalyticsProvider, DI, seed
    SoftwareFactory.Platform.Api/              # Minimal API endpoints (thin), Program.cs
  tests/
    SoftwareFactory.Platform.Application.Tests/ # xUnit CRM use-case tests (EF InMemory / fakes)
```

### Entities (Domain)
- `Client` { Id (Guid), Name, ContactEmail?, Notes?, CreatedAt }
- `Project` { Id, ClientId, Name, SiteType (string, e.g. "ecommerce"|"restaurant"), CurrentPhase
  (`ProjectPhase`), RepoUrl?, Branch?, LiveUrl?, CreatedAt }
- `ApprovalGate` { Id, ProjectId, GateType (`GateType`), ApprovedBy?, ApprovedAt?, Notes?,
  IsApproved (derived: ApprovedAt != null) }
- `ApiUsageRecord` { Id, ProjectId, Model, Tokens (long), CostUsd (decimal), RecordedAt }
- `DeploymentEvent` { Id, ProjectId, Status (`DeploymentStatus`), Source (`DeploymentSource`),
  Payload (string/jsonb), OccurredAt }

### Enums
- `ProjectPhase`: Intake, Foundation, Generation, Build, Harden, Ship, Operate (the 7 phases).
- `GateType`: Architecture, Security, Deploy (the 3 human gates from ARCHITECTURE.md).
- `DeploymentStatus`: Pending, Success, Failure (map CI conclusions).
- `DeploymentSource`: Ci, Manual (JSON: "ci" | "manual").

### Application services (interfaces + impls)
`IClientService`, `IProjectService`, `IApprovalService`, `IUsageService`, `IDeploymentService`,
`IAnalyticsProvider`. Repos: `IClientRepository`, `IProjectRepository`, `IApprovalGateRepository`,
`IApiUsageRepository`, `IDeploymentEventRepository`, `IUnitOfWork`. Key use cases (unit-tested):
`CreateClient`, `CreateProject` (creates the 3 ApprovalGates unapproved + phase=Intake),
`RecordApproval` (sets ApprovedBy/ApprovedAt), `RecordUsage`, `RecordDeploymentEvent`.

### REST API (`/api`, base configurable; JSON; admin-only in real deploy — Phase 3 keeps it simple)
```
GET  /health
GET  /api/clients                          -> ClientDto[]
POST /api/clients            { name, contactEmail?, notes? }        -> ClientDto
GET  /api/clients/{id}                      -> ClientDto
GET  /api/clients/{id}/projects             -> ProjectDto[]
GET  /api/projects                          -> ProjectDto[]
POST /api/projects  { clientId, name, siteType, repoUrl?, branch? } -> ProjectDto
GET  /api/projects/{id}                      -> ProjectDetailDto (project + gates[] + usage summary + recent deployments)
PATCH/api/projects/{id}/phase  { phase }     -> ProjectDto
POST /api/projects/{id}/approvals { gateType, approvedBy, notes? } -> ApprovalGateDto
GET  /api/projects/{id}/usage                -> { records: ApiUsageRecordDto[], totalCostUsd, totalTokens }
POST /api/projects/{id}/usage  { model, tokens, costUsd }          -> ApiUsageRecordDto
GET  /api/projects/{id}/deployments          -> DeploymentEventDto[]
POST /api/projects/{id}/deployments { status, source, payload }    -> DeploymentEventDto
GET  /api/deployments?since=<iso>            -> DeploymentEventDto[]  (outbox feed the bot polls)
GET  /api/analytics/{projectId}              -> AnalyticsDto (NoOp: zeros/empty + provider:"noop")
```
- Security headers + a permissive-for-localhost CORS; secrets from env. Honor `PLATFORM_SKIP_DB_INIT=1`
  to skip migrate/seed at startup (testability). `// TODO(phase-4)`: real admin authn/z, multi-tenant.

## 2. apps/factory-dashboard — Next.js 15 (English only, admin-only)

- English only (no multi-locale). Auth.js (NextAuth v5) Credentials, **admin-only** (single admin
  from env `ADMIN_EMAIL`/`ADMIN_PASSWORD`, JWT session). Tailwind + a small shadcn-style UI kit
  (may copy the pattern from `frontend/src/components/ui`, kept local to this app).
- Talks to the Platform API over HTTP via a server-side typed client
  (`PLATFORM_API_BASE_URL`, default `http://localhost:5090`). Never embeds business logic.
- Pages:
  - `/` → sign-in redirect if unauthenticated.
  - `/clients` — client list → link to projects.
  - `/projects` (and `/clients/[id]`) — project list with current phase badge.
  - `/projects/[id]` — detail: **visual pipeline of the 7 phases** (Intake→…→Operate, current
    highlighted); **approval actions** for the 3 gates (POST approval → records who/when, optimistic
    reflect); **analytics panel** (NoOp placeholder); **API cost table** from `/usage`.
- `POST /api/webhooks/ci` — a Next route handler GitHub Actions calls on job completion. Auth by a
  **shared secret header** `X-Webhook-Secret` (env `CI_WEBHOOK_SECRET`), NOT OAuth. Validates the
  secret, then calls the Platform API `POST /api/projects/{id}/deployments` to create a
  `DeploymentEvent`. Returns 401 on bad/absent secret.
- Playwright E2E: sign in → open a project → approve a gate → see it reflected. Mock the Platform
  API with `page.route` for determinism (dev server, no backend needed in CI).
- `// TODO(phase-4)`: multi-tenant/white-label, real Umami/LiteLLM analytics, client-facing dashboard.

## 3. apps/factory-bot — .NET 9 Worker Service (Telegram.Bot)

```
apps/factory-bot/
  FactoryBot.sln
  src/SoftwareFactory.FactoryBot/            # worker: Telegram.Bot, typed Platform API HttpClient
  tests/SoftwareFactory.FactoryBot.Tests/    # xUnit: command parser + handlers (mock Telegram + API client)
```
- BackgroundService using `Telegram.Bot`. Config from env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`,
  `PLATFORM_API_BASE_URL`. **No duplicated business logic** — a typed `IPlatformApiClient`
  (HttpClient) calls the Platform REST API; the bot has its own thin DTOs.
- Commands (parsed by a testable `CommandParser` → `ICommandHandler`s):
  - `/projects` — list projects with current phase.
  - `/status <projectId>` — one project's phase + gates + latest deployment.
  - `/approve <gate> <projectId>` — POST an approval (gate ∈ Architecture|Security|Deploy).
  - `/help` — usage.
- Notifications: a polling `DeploymentNotifier` hits `GET /api/deployments?since=<last>` on an
  interval; formats new `DeploymentEvent`s and sends to `TELEGRAM_CHAT_ID`. (The webhook "outbox".)
  `// TODO(phase-4)`: replace polling with an internal event/push; factory CRM; AI orchestration.
- Unit tests mock `ITelegramBotClient` and `IPlatformApiClient`: assert `/approve Security <id>`
  parses correctly and calls the API; `/status` formats; unknown command → `/help`.

## 4. Testing & CI
- Platform: `dotnet test platform/SoftwareFactory.Platform.sln` (CRM use-case unit tests, EF InMemory).
- Bot: `dotnet test apps/factory-bot/FactoryBot.sln` (parser/handler tests, all mocked).
- Dashboard: lint + build + Playwright E2E (mocked Platform API).
- Extend `.github/workflows/ci.yml` with jobs: `platform` (setup-dotnet 9.0.x, build+test),
  `factory-bot` (build+test), `factory-dashboard` (npm ci, lint, build, e2e). Use
  `actions/setup-dotnet@v4` with `9.0.x` (never a local-SDK workaround).

## 5. Out of scope → `// TODO(phase-4):`
Multi-tenant/white-label dashboard, real Umami/LiteLLM integrations, client-facing dashboard,
remaining verticals, real payment/ZATCA, AI orchestration, replacing bot polling with push.
