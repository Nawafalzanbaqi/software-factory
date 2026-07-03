# SEO & Performance Standards

Binding for everything user-facing in `frontend/`. Enforced in CI by Lighthouse
(`frontend/lighthouserc.json` — `/ar`, `/en`, `/en/products`;
`frontend/lighthouserc.restaurant.json` — `/`, `/menu`, `/branches`) with minimum
scores: **SEO ≥ 0.8 (error), accessibility ≥ 0.8 (error), performance ≥ 0.8 (warn),
best-practices ≥ 0.8 (warn)**. Error-level assertions block the pipeline; treat all four
as floors.

## 1. Metadata — every page, both locales

- Use the **Metadata API** (`generateMetadata` for dynamic routes) on every page under
  `app/[locale]/`: localized `title` (template from the layout), localized
  `description`, `openGraph` (title/description/locale/type/images), and Twitter card.
- **Canonical + hreflang on every page**: `alternates.canonical` plus `languages`
  entries for `ar` and `en` (mirroring `localePrefix: "as-needed"` — ar unprefixed,
  `/en/...` prefixed). `NEXT_PUBLIC_SITE_URL` is the origin — never hardcode a domain.
- `<html lang>` and `dir` come from the locale (layout); titles/descriptions come from
  message catalogs or CMS fields — never hardcoded strings.
- Pages that must not be indexed (cart, checkout, dashboard, sign-in, order tracking)
  declare `robots: { index: false }`.

## 2. Structured data (JSON-LD) — vertical-aware

- **E-commerce**: `Product` (name, image, offers with price/currency/availability) on
  product detail; `Organization` + `WebSite` site-wide; `FAQPage` on FAQ;
  `BreadcrumbList` on nested catalog pages.
- **Restaurant**: `Restaurant` / `LocalBusiness` (address, geo, openingHours, phone —
  from Branch data) on home/branches; `Menu`/`MenuItem` with `Offer` on menu pages;
  `FAQPage` on FAQ. Do **not** emit Product/Organization schema on restaurant pages —
  the JSON-LD type set follows the active vertical.
- Builders live in `src/lib/seo/` — extend them there; components render
  `<script type="application/ld+json">` from the builders, never inline literal JSON.
- Every JSON-LD field is localized where the page is localized.

## 3. Sitemap, robots, discovery

- `sitemap.xml` and `robots.txt` are generated (`app/sitemap.ts` / `app/robots.ts` +
  `next-sitemap` postbuild) and must include both locale variants of every indexable
  route. New indexable routes must show up without manual sitemap edits — if they
  don't, wire the route source, don't hand-list URLs.
- One `h1` per page; semantic heading order; descriptive, localized link text
  (no "click here" keys in catalogs).

## 4. Images & media

- `next/image` **only** — no raw `<img>` for content images. AVIF/WebP formats are
  configured in `next.config.ts`; remote hosts must be allow-listed in `remotePatterns`
  (tighten, never wildcard-widen for convenience).
- Above-the-fold hero images: `priority` + correct `sizes`. Everything below the fold
  lazy-loads (default). Every informative image has localized `alt`; decorative images
  use `alt=""`.
- Payload media uploads get sized variants; pick the smallest fitting variant.

## 5. Loading & bundle discipline

- **Server Components by default** — shipping a section as a client component is a
  performance regression unless it is genuinely interactive.
- Code-split heavy client leaves with `next/dynamic` (map, carousel, richtext admin
  widgets); browser-only libs (Leaflet) load `ssr: false` and below the fold.
- Keep the shared kit lean: check `optimizePackageImports` covers new icon/util
  libraries; avoid adding dependencies for what Tailwind/existing kit already does.
- No layout shift: dimensions/aspect ratios on images and embeds, skeletons match final
  layout (CLS budget comes from the Lighthouse performance floor).
- Fonts: `next/font` (self-hosted, subset, `display: swap`) — no render-blocking font
  CSS from third-party origins.

## 6. Caching & data

- Hot read paths on the backend use `CachingBehavior` (Redis) via `ICacheableQuery` —
  listing/catalog queries belong there; invalidate on the module's writes.
- Static-friendly pages use SSG/ISR (`revalidate`) rather than per-request fetches;
  request-time work is reserved for personalized/cart/checkout flows.
- API responses are paginated (`page`/`pageSize`) — never unbounded lists to the client.

## 7. Verifying (part of frontend definition of done)

```bash
cd frontend
npm run build                                   # both verticals if routing/sections changed
npx --yes @lhci/cli@0.13.x autorun              # ecommerce budget
OPTIONS_FILE=options.restaurant.json \
npx --yes @lhci/cli@0.13.x autorun --config=lighthouserc.restaurant.json
```

A PR that lowers a Lighthouse category below its floor, removes metadata/JSON-LD, or
regresses image/bundle discipline fails the review gate — fix the regression, do not
lower the threshold. Threshold changes are an explicit human decision recorded in the
PR description.
