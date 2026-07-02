# Factory Dashboard (Phase 3)

Internal **control plane** for the Software Factory — admin-only tooling to watch
projects move through the 7-phase pipeline, approve the 3 human gates, and see API
cost + analytics. This is a **self-contained** Next.js 15 app (English only, no
next-intl, no Payload). It embeds **no business logic**: every read/write is a thin
HTTP call to the Platform API.

> Phase 3 is additive. This app does not touch `backend/src` or the existing
> `frontend/`. See `docs/PHASE3.md` §2 and `docs/ARCHITECTURE.md`.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript (strict)
- Tailwind CSS + a small local shadcn-style UI kit (`src/components/ui`)
- Auth.js (NextAuth v5), Credentials provider, **admin-only**, JWT session
- Playwright for E2E

## Scripts

| Script              | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the dev server (port 3000)      |
| `npm run build`     | Production build (standalone output)  |
| `npm run start`     | Serve the production build            |
| `npm run lint`      | ESLint (next/core-web-vitals)         |
| `npm run typecheck` | `tsc --noEmit`                        |
| `npm run test:e2e`  | Playwright E2E (mocked Platform API)  |

## Environment variables

Copy `.env.example` → `.env.local`.

| Variable                | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `AUTH_SECRET`           | Signs the Auth.js JWT session cookie                           |
| `AUTH_TRUST_HOST`       | Trust the host header (self-hosted)                            |
| `ADMIN_EMAIL`           | The single admin's email (sign-in credential)                  |
| `ADMIN_PASSWORD`        | The single admin's password (sign-in credential)               |
| `PLATFORM_API_BASE_URL` | Platform API base URL (default `http://localhost:5090`)        |
| `CI_WEBHOOK_SECRET`     | Shared secret for `POST /api/webhooks/ci` (`X-Webhook-Secret`) |

## Auth

Auth.js v5 Credentials, **admin-only**: there is exactly one operator, whose
credentials are `ADMIN_EMAIL`/`ADMIN_PASSWORD` (checked directly — no user store).
JWT session. `src/middleware.ts` protects **every** page via the `authorized`
callback; unauthenticated requests are redirected to `/sign-in`.

## Pages

- `/sign-in` — admin credentials form.
- `/clients` — client list.
- `/projects` — project list with a current-phase badge.
- `/projects/[id]` — detail:
  - **Visual 7-phase pipeline** (Intake → Foundation → Generation → Build →
    Harden → Ship → Operate) with the current phase highlighted, done phases
    checked, upcoming phases dimmed.
  - **3 approval gates** (Architecture, Security, Deploy) with an approve action
    (server action → Platform API; records who/when; reflected on refresh).
  - **Analytics panel** — NoOp placeholder (`GET /api/analytics/{id}`).
  - **API cost table** — per-model rows + total (`GET /api/projects/{id}/usage`).
  - Recent deployment events.

## Platform API endpoints consumed

Server-side typed client: `src/lib/platform-api.ts` (base `PLATFORM_API_BASE_URL`).

| Method | Path                             | Used by                              |
| ------ | -------------------------------- | ------------------------------------ |
| GET    | `/api/clients`                   | `/clients`, `/projects`              |
| GET    | `/api/projects`                  | `/projects`                          |
| GET    | `/api/projects/{id}`             | `/projects/[id]` (detail: project + gates + usage summary + recent deployments) |
| POST   | `/api/projects/{id}/approvals`   | approve gate (server action)         |
| GET    | `/api/projects/{id}/usage`       | API cost table                       |
| GET    | `/api/analytics/{id}`            | analytics panel (NoOp)               |
| POST   | `/api/projects/{id}/deployments` | `POST /api/webhooks/ci` route handler |

The client also exposes `GET /api/clients/{id}` and `GET /api/clients/{id}/projects`
for future use.

## CI webhook

`POST /api/webhooks/ci` — GitHub Actions calls this on job completion. Auth is a
**shared secret header** `X-Webhook-Secret` (env `CI_WEBHOOK_SECRET`), **never
OAuth**. On a valid secret it forwards to the Platform API
`POST /api/projects/{id}/deployments` to create a `DeploymentEvent` (`source: "ci"`,
mapping the GitHub conclusion to `Pending|Success|Failure`). Bad/absent secret → 401.
This route is excluded from the session-auth middleware.

## E2E

`e2e/dashboard.spec.ts`: sign in → open a project → approve a gate → see it
reflected. Because the dashboard fetches the Platform API **server-side**
(Server Components + server actions), Playwright's `page.route` cannot intercept
those Node-side requests, so the test stands up a tiny in-process mock Platform API
on `:5090` for full determinism (no live backend). `page.route` is still used to
assert no browser→Platform calls leak. `webServer` runs the dev server and
`reuseExistingServer` is on outside CI.

## Design notes / out of scope

- `// TODO(phase-4)`: multi-tenant / white-label, real Umami/LiteLLM analytics
  (analytics is a NoOp provider today), client-facing dashboard.
