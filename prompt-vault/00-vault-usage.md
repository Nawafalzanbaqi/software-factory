# Prompt Vault — Usage

The prompt vault is the **standards library of the software factory**. Every AI agent
(and every human) that generates, modifies, or reviews code in this repository loads the
relevant vault documents into context **before** producing anything. The vault turns the
factory's architecture decisions into enforceable, reusable instructions so that each new
client project (e-commerce, restaurant, and every future vertical) is built to the same
bar without re-deriving the rules.

## What lives here

| File | Scope | Load when… |
|------|-------|-----------|
| `00-vault-usage.md` | this file — how the vault works | always (cheap, read first) |
| `backend-standards.md` | .NET 9 client backend + platform: Clean Architecture, CQRS, modules, testing | touching `backend/`, `platform/`, `apps/factory-bot/` |
| `frontend-standards.md` | Next.js frontend + dashboard: feature folders, Server Components, i18n/RTL, CMS | touching `frontend/`, `apps/factory-dashboard/` |
| `security-standards.md` | the security gate: validation, headers, authn/z, secrets, dependency triage | **every** task that ships code, plus dedicated triage passes |
| `seo-performance-standards.md` | SEO metadata, JSON-LD, i18n SEO, Core Web Vitals, Lighthouse budgets | touching anything user-facing in `frontend/` |
| `review-agent.prompt` | the adversarial review agent's system prompt | running the review gate on a diff/PR |

## The contract hierarchy

Vault documents **restate and operationalize** the repository's binding contracts. If a
conflict is ever found, the precedence is:

1. `docs/ARCHITECTURE.md` (+ `docs/PHASE2.md`, `docs/PHASE3.md`) — the design contract:
   routes, DTO shapes, module names, layer rules.
2. `options.schema.json` / `options.*.json` — what is buildable and enabled per vertical.
3. This vault — *how* to implement and review against those contracts.
4. Local file conventions (match the surrounding code when all above are silent).

A vault rule that contradicts `docs/ARCHITECTURE.md` is a bug in the vault: fix the vault
document in the same PR that surfaces the conflict, and say so in the PR description.

## How agents use the vault

- **Generation agents** (building a feature/module): load `00-vault-usage.md`, the
  tier-specific standards, and `security-standards.md`. Frontend work additionally loads
  `seo-performance-standards.md`. Follow the standards *silently* — code should comply
  without needing comments that cite rules.
- **Review agents**: run with `review-agent.prompt` as the system prompt and the other
  five documents as reference context. The review gate is **adversarial**: its job is to
  find contract violations, not to summarize the diff.
- **Triage/maintenance agents** (dependency updates, CI repair): `security-standards.md`
  §Dependencies is binding — lockfiles are regenerated, never hand-edited; every alert
  decision is recorded in `docs/SECURITY-TRIAGE.md`.

## Non-negotiables (apply to every task)

1. **Feature-flag pattern, never delete.** Disabled features stay on disk; they are just
   not registered/rendered. Turning something off must never remove its module.
2. **Additive module pattern.** Adding a feature = adding new folders; editing existing
   modules requires an explicit reason and is a review flag.
3. **Config-driven.** Behavior differences between verticals/deployments come from
   `options.json` (`SF_OPTIONS_FILE` / `OPTIONS_FILE` overrides), not from code forks.
4. **The full verification suite must be green** before any merge to `main`:
   backend + platform + bot `dotnet test`, frontend lint/typecheck/unit/build, Playwright
   E2E (both verticals), factory-dashboard lint/typecheck/build/E2E,
   `node scripts/verify-verticals.mjs`, and Lighthouse CI thresholds
   (`frontend/lighthouserc.json`, `frontend/lighthouserc.restaurant.json`).
5. **No secrets in the repo.** Env only (`.env.example` documents the shape). Generated
   artifacts (`next-env.d.ts`, `openapi.json`, lockfile-adjacent build output) are not
   hand-edited; generated-but-committed files are limited to `package-lock.json`.
6. **Never downgrade a `net9.0` target** or pin below the versions in
   `Directory.Packages.props` to work around tooling; fix the tooling instead.

## Maintaining the vault

- Keep documents **concrete**: real paths, real commands, real names from this repo.
- When a standard changes (new vertical, new gate, new budget), update the vault in the
  same PR that changes the behavior, and note it in the PR body.
- Version history is git; do not keep "v2" copies inside the vault.
