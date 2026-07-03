# Frontend Standards — Next.js App Router, i18n/RTL, Feature-Based

Binding for `frontend/` (client product, ar/en) and — where noted — for
`apps/factory-dashboard/` (internal, English-only). The design contract is
`docs/ARCHITECTURE.md` §3 and `docs/PHASE2.md` §4–5.

## 1. Structure — feature folders, not type folders

```
frontend/src/
  app/[locale]/…            # routes; every user page lives under the locale segment
  app/(payload)/            # Payload admin route group (not locale-prefixed)
  features/<feature>/       # self-contained: components/ hooks/ api/ messages/ types.ts index.ts
  components/{ui,layout,providers,auth,home}/   # shared kit only
  lib/{config,api,i18n,seo,auth,cms,utils}/
  messages/{ar,en}.json     # merged next-intl catalogs
  payload/{collections,globals}/
```

- A feature is **self-contained**: its components, hooks, typed API calls, message
  fragments, and types live in its folder; `index.ts` is the barrel that exports the
  mountable Section/components. Cross-feature imports go through barrels only.
- Adding a feature = new folder + wiring (messages merge, route page, `HomeSections.tsx`
  mapping guarded by `isSectionEnabled(...)`, nav in `components/layout/nav-items.ts`
  filtered by `isFeatureEnabled(...)`/siteType). Never edit another feature to add yours.
- All backend access goes through `lib/api/client.ts` (typed against the OpenAPI
  contract; regen with `npm run gen:api`). Features never `fetch` raw URLs.

## 2. Server Components by default

- Pages, sections, and data-fetching components are **Server Components**. `"use client"`
  is allowed only on interactive leaves (forms, cart button, quantity stepper, locale
  switcher, carousel, map). A `"use client"` at page/section level is a review finding.
- Client state: Zustand for cart-like cross-component state; react-hook-form + zod
  resolvers for forms. Server data is fetched in Server Components — no client-side
  fetching for first render of primary content.
- The Leaflet branch map and similar browser-only widgets are client leaves, loaded
  lazily (`dynamic(() => …, { ssr: false })`) below the fold.

## 3. i18n / RTL (the factory's hardest requirement — never regress it)

- Locales `['ar','en']`, **default `ar`, RTL**. Central definition:
  `src/lib/i18n/routing.ts` (`defineRouting`, `localePrefix: "as-needed"` — ar unprefixed,
  `/en/...` prefixed). Navigation helpers come from `src/lib/i18n/navigation.ts`
  (`createNavigation(routing)`) — **always** use these `Link`/`redirect`/`useRouter`,
  never `next/link`/`next/navigation` directly in localized UI.
- `app/[locale]/layout.tsx` sets `<html lang={locale} dir={getDirection(locale)}>`.
  Components must be direction-agnostic: Tailwind **logical utilities**
  (`ms-*`/`me-*`/`ps-*`/`pe-*`, `start-*`/`end-*`, `text-start`) instead of
  `ml/mr/pl/pr/left/right`. Icons/chevrons that imply direction flip with
  `rtl:rotate-180` (or an RTL-aware wrapper).
- **No hardcoded copy in components — ever.** UI strings come from
  `useTranslations()`/`getTranslations()` namespaces; editorial/section copy comes from
  Payload (localized fields, `localized: true`). Every feature ships `en.json` + `ar.json`
  fragments merged into `src/messages/{en,ar}.json`; a key present in one catalog must be
  present in the other.
- Locale-aware formatting only (`useFormatter`/`Intl`): numbers, currency (SAR),
  dates. Never `toLocaleString()` with a hardcoded locale, never string-concatenated
  prices.
- Middleware (`src/middleware.ts`) = next-intl negotiation + security headers. Its
  matcher excludes `api`, `admin` (Payload owns it), `_next`, static assets — keep it so.

## 4. Config-driven rendering

- `src/lib/config/options.ts` is the only reader of `options.json`
  (`OPTIONS_FILE` override). Use `getSiteType()`, `isFeatureEnabled()`,
  `isSectionEnabled()`, `getEnabledSections()` — never import the JSON directly.
- The homepage renders `getEnabledSections()` in `order` via
  `components/home/HomeSections.tsx`. Vertical-only pages guard with `getSiteType()`
  and call `notFound()` on mismatch (`/products`, `/categories`, `/wishlist` =
  ecommerce; `/menu`, `/branches`, `/reservations`, `/gallery` = restaurant).
  `scripts/verify-verticals.mjs` enforces this — run it after any nav/section/guard
  change.

## 5. CMS (Payload 3, embedded)

- Collections/globals in `src/payload/{collections,globals}/`; every editorial text
  field is `localized: true`. Typed fetchers in `src/lib/cms/` — components never query
  Payload's API ad hoc.
- Payload admin lives at `/admin` inside the `(payload)` route group; it is excluded
  from i18n middleware and from client-tier auth. Content model changes must keep
  existing seed/content valid.

## 6. UI kit & accessibility

- shadcn/ui pattern: primitives in `components/ui/` (Radix + Tailwind + cva). Extend the
  kit there; don't fork one-off variants inside features. Design tokens are CSS vars in
  `app/globals.css` + `tailwind.config.ts` — no hex literals in components.
- Accessibility is part of done: semantic landmarks, one `h1` per page, labelled
  controls (Radix `Label`), visible focus states, WCAG AA contrast, alt text on every
  informative image (localized), keyboard-operable interactions. Lighthouse a11y ≥ 0.8
  is **error-level** in CI — treat it as a floor, not a target.
- Mobile-first: base styles are the phone layout; enhance upward with `sm:`/`md:`/`lg:`.

## 7. Forms & validation

zod schema per form (shared with the API call payload), react-hook-form +
`@hookform/resolvers`, localized error messages via message catalogs, server-side
re-validation always (the backend FluentValidation is the source of truth — client zod
is UX, not security).

## 8. factory-dashboard deltas (`apps/factory-dashboard`)

English-only (no next-intl), single-admin Auth.js Credentials from
`ADMIN_EMAIL`/`ADMIN_PASSWORD`, JWT session; talks only to the Platform API through the
server-side typed client (`PLATFORM_API_BASE_URL`); `POST /api/webhooks/ci` authenticates
with the `X-Webhook-Secret` header (`CI_WEBHOOK_SECRET`) and 401s otherwise. Everything
else here (structure, Server Components, a11y, testing) applies as-is.

## 9. Testing & verification (frontend definition of done)

- `npm run lint` (ESLint flat config), `npm run typecheck` (strict TS — no `any`
  escapes), `npm run test:unit` (Vitest + Testing Library for logic/components),
  `npm run build` (must pass for BOTH verticals when routing/sections changed:
  `OPTIONS_FILE=options.restaurant.json npm run build`).
- Playwright E2E: happy-path checkout for ecommerce AND restaurant
  (`E2E_VERTICAL=restaurant`). New user-critical flows get an E2E spec.
- `npm run verify:verticals` after any change to nav, sections, guards, or options
  schema.
- Generated files are never committed: `next-env.d.ts` is gitignored (do not re-add it);
  `src/lib/api/openapi.ts` is regenerated, not hand-edited.
- SEO/perf budgets in `seo-performance-standards.md` apply to every page you add.
