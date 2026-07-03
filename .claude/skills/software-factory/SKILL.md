---
name: software-factory
description: >
  Engineering conventions, architecture, and module patterns for the
  software-factory monorepo — a configuration-driven "software factory" that
  generates multi-vertical client websites (ecommerce, restaurant, and more)
  from a shared, options.json-gated foundation, plus an internal control plane
  (platform API + factory dashboard + Telegram bot). ALWAYS consult this skill
  before writing or modifying ANY code in this repo: backend (.NET Clean
  Architecture), frontend (Next.js feature-based), platform, apps/*, Payload
  CMS collections, EF migrations, options manifests, or CI. It encodes the
  mandatory Clean Architecture layering, the shared-vs-vertical module contract,
  the feature-flag/404 gating rule, and the human approval gates — skipping it
  produces code that breaks the architecture, the REST contract, or a security
  gate.
---

# Software Factory — Engineering Skill

> Read this file fully at the start of every session. Treat it as hard
> constraints, alongside `prompt-vault/*`. When this skill and a code request
> conflict, the skill wins — surface the conflict instead of silently violating it.

## 1. What this repo is

A **software factory**: one reusable, config-driven codebase that produces many
client websites of different *verticals* (site types), plus the internal tooling
to run the factory as a business.

The single most important idea: **a feature is a module you plug in, never a
rewrite.** Every optional capability (a section, an integration, a whole
vertical) is a self-contained module that slots into all architectural layers.
This only works because of strict Clean Architecture — so the architecture is
not decoration, it is the mechanism that makes the factory possible.

## 2. Monorepo map

```
/
├─ options.json                 # active root manifest (boots when OPTIONS_FILE is unset; currently ecommerce)
├─ options.<vertical>.json      # per-vertical build manifests (ecommerce, restaurant, …)
├─ options.schema.json          # JSON schema for the manifests
├─ scripts/verify-verticals.mjs # boot-twice generalization proof (extend per vertical)
├─ prompt-vault/                # engineering standards, injected every session
├─ docs/                        # ARCHITECTURE.md, PHASE*.md, SECURITY-TRIAGE.md
├─ .github/workflows/ci.yml     # all CI jobs (append, never reorder existing)
│
├─ backend/                     # CLIENT product API — .NET 9, Clean Architecture
│  └─ src/SoftwareFactory.{Domain,Application,Infrastructure,Api}
│  └─ tests/SoftwareFactory.{Application.Tests,IntegrationTests,VerticalRoutingTests}
│
├─ frontend/                    # CLIENT product web — Next.js 16, feature-based
│  └─ src/{app,features,components,lib,payload,messages,test,types}
│
├─ platform/                    # INTERNAL control plane API (lighter-weight CA)
│  └─ src/SoftwareFactory.Platform.{Domain,Application,Infrastructure,Api}
│
└─ apps/
   ├─ factory-dashboard/        # INTERNAL Next.js 15.5 admin (CRM, gates, analytics)
   └─ factory-bot/              # INTERNAL .NET Telegram worker (calls platform API)
```

**Three distinct products — never mix their concerns:**
1. `backend/` + `frontend/` = the client-facing product (gated by options.json).
2. `platform/` = internal control plane (NOT gated by options.json).
3. `apps/*` = internal operator tools that consume the platform API over HTTP.

## 3. Clean Architecture — the non-negotiable core

Four layers. **Dependencies point inward only.** Nothing in an inner layer may
reference an outer layer.

```
Api  ─────▶ Application ─────▶ Domain
                 ▲
 Infrastructure ─┘  (implements Application interfaces; never referenced inward)
```

- **Domain** — entities, value objects, domain events, business rules.
  ZERO external packages. No EF, no MediatR, no ASP.NET. If you `using` a
  framework here, you are wrong.
- **Application** — use cases as CQRS Commands/Queries (MediatR), DTOs,
  FluentValidation validators, and **interfaces** for anything external
  (repositories, gateways, lookups). Depends only on Domain.
- **Infrastructure** — EF Core (Npgsql), Redis, external service clients,
  and the concrete implementations of Application interfaces. Depends on
  Application + Domain. Registered via `DependencyInjection.cs`.
- **Api / Presentation** — Minimal API endpoint mappings only. No business
  logic, no validation, no data access. Depends on Application (+ DI wiring).

**Self-check before committing backend code:**
- Does Domain import any framework? → move it out.
- Is there logic (branching on business rules) in an endpoint? → move to a handler.
- Did you access `DbContext` outside a repository? → wrap it behind an interface.
- Did you return a Domain entity from the API? → return a DTO instead.

The same layering applies to `platform/`, but **deliberately lighter**: plain
application services instead of MediatR/pipeline behaviors, EF-InMemory tests
instead of Testcontainers. It is internal tooling — do not over-engineer it, and
do not "upgrade" it to match the client backend. This choice is documented in
`platform/README.md`; respect it.

## 4. The module pattern — how to add ANY feature

A feature spans every layer as one vertical slice. To add feature `X`
(e.g. Reviews), create — and only create — these, touching no existing module:

**Backend**
- `Domain/.../X/` — entity + value objects + domain events for X.
- `Application/.../X/` — `Commands/`, `Queries/`, `Dtos/`, `Validators/`,
  and `IXRepository.cs` (the interface).
- `Infrastructure/.../X/` — `XRepository.cs` (implements the interface) +
  EF `XConfiguration.cs`; register in `DependencyInjection.cs`.
- `Api/.../X/XEndpoints.cs` — map endpoints; gate mapping behind the feature flag.
- Add an EF migration for the new tables.

**Frontend**
- `features/x/` — `components/`, `hooks/`, `api/`, `types.ts`, `index.ts`,
  `messages/{ar,en}.json`. Self-contained; no imports from other features.
- `payload/collections/X.ts` — so the section's content is editable from the
  client dashboard.
- Wire nav/route only when the flag is enabled.

**Test**
- At least one Application unit test for the new use case.
- Extend E2E if it adds a user flow.

If adding a feature forces you to edit an existing module, stop — the boundary
is wrong. Fix the abstraction (see §5), don't cross-wire.

## 5. Shared vs Vertical — the contract that makes generalization real

This is the hardest-won rule in the codebase (proven when Cart/Orders moved to
`Shared/Ordering` and served both ecommerce and restaurant unchanged).

- **`Shared/…`** — genuinely vertical-agnostic modules reused by multiple
  verticals (e.g. `Shared/Ordering`: Cart, Order, PlaceOrderService).
- **`Modules/…`** — feature modules. Vertical-owned slices nest under a
  vertical folder: `Modules/Ecommerce/` (Checkout) and `Modules/Restaurant/`
  (Menu, Branch, Table, Reservation, restaurant checkout). Standalone modules
  sit at the top level (`Catalog`, `Wishlist`, `Reviews`, `Contact`, `Search`)
  and are mapped per `siteType`/feature flag in `Program.cs`.

**Rules:**
- A vertical may reference `Shared/`. **A vertical must NEVER reference another
  vertical.** If restaurant code imports ecommerce code, that's a defect.
- Cross-vertical differences hide behind an interface in Application, with a
  per-vertical implementation registered in Infrastructure by `siteType`.
  The reference example is `ICatalogItemLookup` → `ProductCatalogItemLookup`
  (ecommerce) / `MenuItemCatalogItemLookup` (restaurant). Follow this exact
  pattern for any new cross-vertical seam.
- Shared line items use a generic `ItemId` + denormalized name/price/slug/image —
  **no foreign key to Product or MenuItem.** Keep it that way.
- **REST contract is immutable:** existing DTO field names (e.g. `productId`)
  stay byte-identical. Phase 1/2 test files are frozen contracts — a refactor
  must keep them passing UNCHANGED. If a change would alter the wire format,
  it needs an explicit human architecture-gate decision, not a quiet edit.

Before moving anything into `Shared/`, ask: *is this truly generic, or just
generic-looking today?* Document every shared/vertical decision in `README`
(§3a) so the next vertical inherits the reasoning.

## 6. Configuration-driven build (options.json)

`options.<vertical>.json` — selected via the `OPTIONS_FILE` env var (frontend,
scripts, e2e) or `SF_OPTIONS_FILE` (backend), both falling back to the root
`options.json` — drives what exists in a given build: `siteType`, `language`,
`defaultDirection`, `designDirection`, `payments[]`, `integrations[]`, a
`features{}` map, and a `sections{}` map (per-section `enabled` + `order`).

- Both backend and frontend read the manifest and conditionally register
  modules / routes / nav / seed from it.
- **A disabled feature returns 404 (route not mapped) — never 403, never a
  hidden-but-present route.** The code module still exists; it's just toggled
  off. This is the factory's core guarantee and is verified by
  `scripts/verify-verticals.mjs` and `VerticalRoutingTests`.
- When you add a feature or vertical, extend `options.schema.json` and the
  boot-twice verification so both `siteType`s (and the disabled-feature
  absence) stay proven.

## 7. Frontend specifics

- **Feature-based** folders; a feature never imports another feature's internals —
  only `lib/` and `components/ui`.
- **Server Components by default**; `"use client"` only on interactive leaves,
  each justifiable in one sentence.
- **All copy** comes from `messages/*` (next-intl) or Payload — no hardcoded
  user-facing strings (lint fails otherwise).
- **i18n/RTL:** ar + en (next-intl config under `lib/i18n`), logical CSS
  properties (`ps/pe/ms/me`), correct direction per language; test new pages
  in `ar`.
- **Types for backend data derive from the OpenAPI contract / shared types —
  never hand-write response shapes.** (A Phase 3 defect slipped through exactly
  because a dashboard type and its E2E mock both mirrored a wrong shape. Derive,
  don't duplicate; make at least one E2E run against the real backend.)
- **Framework versions are coupled:** `frontend/` runs Next 16.2.x + React 19.2
  + Payload 3.85.x, upgraded in lockstep (`payload` and every `@payloadcms/*`
  package pin the exact same version; Payload's peer range dictates the Next
  major). `apps/factory-dashboard` stays on Next 15.5 (no Payload). Resolve
  peer conflicts properly — never `npm install --legacy-peer-deps`.
- `next-env.d.ts` is auto-generated — it must be gitignored, not committed.

## 8. Security, SEO, performance gates (summary — full rules in prompt-vault)

- Security headers always on (CSP, HSTS, X-Frame-Options, …); secrets via env
  only (gitleaks blocks leaks); parameterized queries only; rate limiting on
  public endpoints; validation before every handler. SAST/Trivy/gitleaks must
  be clean of high/critical.
- SEO: SSR/SSG + Metadata API, per-vertical JSON-LD, vertical-aware sitemap +
  robots, hreflang ar/en, canonical URLs.
- Performance: Lighthouse CI budgets (Perf≥90, SEO≥95, A11y≥95, BP≥95);
  LCP<2.5s, INP<200ms, CLS<0.1; Redis for hot reads; ISR + revalidate-on-edit.

## 9. External integrations — the NoOp rule

Every external service sits behind an Application interface with a `NoOp*`
implementation (e.g. `NoOpPaymentGateway`, `NoOpEInvoiceService`,
`NoOpAnalyticsProvider`). **The system must boot and pass tests with zero API
keys set.** Wiring a real provider is a one-line DI swap; never make a real
third-party call in tests (record/replay or sandbox only). New integrations
(Tamara, Tabby, ZATCA, WhatsApp, Umami, LiteLLM) follow this exact pattern.

## 10. Human approval gates — never automate these

Automation is ~90% end-to-end, but three gates are ALWAYS human and must never
be bypassed by an agent:
1. **Architecture approval** before merging to `main`.
2. **Security approval** on any change touching money, auth, or PII.
3. **Production deploy approval.**

Merging PRs is the human's action. An agent prepares and pushes branches, opens
PRs, and reports CI status — it does not merge.

## 11. Workflow rules for agents

- **Never build on red CI.** Verify the target branch's latest CI is green (via
  `gh`) before starting new work; if red, fix root cause first and report.
- Work on a feature branch; commit, push, open a PR; report CI status + a file
  tree. Do not paste large file contents into chat.
- Run the FULL suite before declaring done: backend build+test (incl.
  Testcontainers in CI), frontend lint+typecheck+unit+build+e2e, platform, bot,
  dashboard, verify-verticals, Lighthouse.
- Run the adversarial review pass (`prompt-vault/review-agent.prompt`) and
  fix real findings before reporting green. Green tests that mirror a wrong
  contract are the top failure mode here — assume a passing test can still lie.
- CI jobs are additive: append new jobs, never reorder/rename existing ones
  (conflict-prone in `ci.yml`).
- Lockfiles are regenerated (`npm install`), never hand-edited. Downgrading a
  `net9.0` target framework to dodge a local SDK error is forbidden — fix the
  environment, not the project.
- `.NET 9` and `Node 20` are the toolchain. Local `NETSDK1045` means the machine
  lacks the .NET 9 SDK; that is a local issue, not a repo change.

## 12. Definition of Done for any change

- [ ] Respects Clean Architecture layering (no inward → outward references).
- [ ] New capability added as a self-contained module; no existing module edited
      to accommodate it (or the shared abstraction was extended per §5).
- [ ] Feature correctly gated by options.json (disabled ⇒ 404, absent from nav/seed).
- [ ] REST contract + frozen Phase 1/2 tests unchanged.
- [ ] ar/en + RTL correct; no hardcoded copy; content editable via Payload.
- [ ] Security/SEO/perf gates pass; secrets via env; NoOp fallback intact.
- [ ] Full suite + adversarial review green; PR opened; human gate left to the human.
