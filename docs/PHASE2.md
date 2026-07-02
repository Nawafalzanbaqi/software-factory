# Phase 2 — Restaurant vertical + Shared/Core extraction (contract)

Phase 2 adds a **second, structurally different vertical (Restaurant / Food Ordering)** on the
SAME foundation to prove the config-driven architecture generalizes. This doc is the shared
contract every agent implements against. Read it with [`ARCHITECTURE.md`](ARCHITECTURE.md).

The app runs **one vertical per boot**, selected by `options.json` `siteType`
(`ecommerce` | `restaurant`). Nothing runs both at once.

## 1. Vertical selection mechanism (config-driven)

- **Which options file:** both tiers read `options.json` by default. An env override selects a
  variant so the app can boot as either vertical without editing files:
  - Backend: `SF_OPTIONS_FILE` (absolute path or path relative to repo root).
  - Frontend: `OPTIONS_FILE` (same semantics; server-side read).
- Files: `options.json` (active, currently ecommerce), **`options.ecommerce.json`**, and new
  **`options.restaurant.json`**. `options.schema.json` already allows `siteType: "restaurant"`.
- **Accessors:** backend `OptionsManifest.SiteType` + `IFeatureManager` gains
  `SiteType`/`IsVertical(name)`. Frontend `src/lib/config/options.ts` gains `getSiteType()`.
- **Registration/routing gating:**
  - Backend `Program.cs` maps a module's endpoints only when its **siteType + feature/section**
    are enabled (extends the Phase 1 feature-flag gating with a vertical check).
  - Frontend vertical-specific pages call `notFound()` when `getSiteType()` doesn't match; nav +
    homepage sections come from the active `options.*.json`. Wrong vertical's routes must 404.
- **Testability:** `Program.cs` honors `SF_SKIP_DB_INIT=1` to skip migrate/seed at startup so a
  `WebApplicationFactory` test can boot and assert the registered endpoint set without Postgres.

## 2. SHARED vs VERTICAL-SPECIFIC (the critical determination)

Move the **generic ordering pipeline** into a shared/core module reused by both verticals; keep
catalog + fulfillment specifics in each vertical. Rationale documented in README §"Shared vs
Vertical-Specific Modules".

### Shared / Core (generic — used by BOTH verticals) → `.../Shared/Ordering/`
- **Domain:** `Cart`, `CartItem`, `Order`, `OrderItem`, `OrderStatus`,
  `OrderStatusHistoryEntry`, `OrderPlacedDomainEvent`, `Money`.
  - `CartItem`/`OrderItem` reference a **generic catalog item** by `ItemId` (Guid) plus
    denormalized `NameEn/NameAr`, `Slug`, `ImageUrl`, `UnitPrice`. No FK to Product/MenuItem —
    this is what makes them vertical-agnostic.
  - `Order` carries **optional** fulfillment metadata as nullable owned value objects:
    `ShippingAddress?` (ecommerce) and `Fulfillment?` = `{ Type (DineIn|Pickup|Delivery),
    BranchId?, TableId?, ScheduledFor? }` (restaurant). Only one is set per order.
- **Application:** `ICartRepository`, `IOrderRepository`, `IUnitOfWork`; cart use cases
  (Add/Update/Remove/GetCart), `GetOrderTracking`, `GetMyOrders`, and a generic
  `PlaceOrderService`/base command the vertical checkouts call. DTOs: `CartDto`, `CartItemDto`,
  `OrderDto`, `OrderTrackingDto`.
- **Api:** shared `/api/v1/cart/*`, `/api/v1/orders/*` endpoints (registered for both verticals).

> **Wire-compat rule:** the shared Cart/Order **DTO field stays named `productId`** (it is the
> generic catalog-item id — a Product id for ecommerce, a MenuItem id for restaurant). This keeps
> the Phase 1 REST contract + frontend byte-identical. Domain uses `ItemId`; DTO maps it to
> `productId`.

### E-commerce-specific (stays) → `.../Modules/Catalog/`, `.../Modules/Ecommerce/`
- Catalog (Product, Category), Wishlist, ecommerce **Checkout** (`CheckoutCommand` capturing
  `shippingAddress` + payment) → calls shared `PlaceOrder` with a shipping fulfillment.
- Ecommerce Search (products). Routes/DTOs UNCHANGED from Phase 1.

### Restaurant-specific (new) → `.../Modules/Restaurant/`
- Domain entities: **MenuCategory, MenuItem, Branch, Table, Reservation**.
- Restaurant **Checkout** (`PlaceFoodOrderCommand` capturing `fulfillmentType`, `branchId`,
  `tableId?`, `scheduledFor?`, delivery address?) → calls shared `PlaceOrder` with a food
  fulfillment. Restaurant Search (menu items).

### Constraint
All **existing Phase 1 tests must pass UNCHANGED** (do not edit test files):
`Application.Tests` (Catalog: CreateProduct/GetProducts; Contact: SubmitContact) and
`IntegrationTests` (ProductRepository). They don't touch Cart/Orders, so the move is safe — keep
Catalog + Contact + Product namespaces and the ecommerce REST contract stable.

## 3. Restaurant REST contract (`/api/v1`, registered when siteType=restaurant)

```
GET  /menu/categories                      -> MenuCategoryDto[]
GET  /menu/items?category=&search=&page=&pageSize=&sort=  -> PagedResult<MenuItemDto>
GET  /menu/items/{slug}                    -> MenuItemDto
GET  /branches                             -> BranchDto[]           (with lat/lng for map)
GET  /branches/{slug}                      -> BranchDto
POST /reservations                         { branchId, customer{name,email,phone}, partySize, dateTime, tableId?, notes? } -> { reference }
GET  /reservations/{reference}             -> ReservationDto        (track)
GET  /search?q=                            -> MenuItemDto[]         (restaurant vertical)
POST /checkout                             (restaurant body — see PlaceFoodOrder) -> { orderNumber }
# shared (both verticals): /cart/*, /orders/{n}/track, /contact, /reviews/* (flag)
```

### Restaurant DTOs (records)
```
MenuCategoryDto { id, slug, nameEn, nameAr, imageUrl?, itemCount }
MenuItemDto     { id, slug, nameEn, nameAr, descriptionEn, descriptionAr, price, currency,
                  categoryId, images: string[], isAvailable, tags: string[], spicyLevel?, calories? }
BranchDto       { id, slug, nameEn, nameAr, addressEn, addressAr, city, latitude, longitude,
                  phone, openingHours }
ReservationDto  { reference, branchId, status, partySize, dateTime, customerName, createdAt }
PlaceFoodOrderRequest { cartId, customer{name,email,phone}, fulfillmentType:"dinein"|"pickup"|"delivery",
                  branchId, tableId?, deliveryAddress?, scheduledFor?, paymentMethod }
```

## 4. Restaurant sections (each = entity/CMS + use case + repo/endpoint + frontend feature + Payload collection)

Homepage order from `options.restaurant.json.sections`:
`hero(1)`, `promotions(2)`, `menu(3)`, `gallery(4)`, `branches(5)`, `reservation(6)` (CTA),
`reviews(7, OFF)`, `about(8)`, `faq(9)`, `contact(10)`, `footer(99)`.

| Section        | Data source | Frontend feature | Payload |
|----------------|-------------|------------------|---------|
| Hero           | CMS         | `hero` (reuse)   | Hero global (reuse) |
| Menu (cats+items) | backend  | `menu`           | MenuCategory, MenuItem |
| Item Detail    | backend     | `menu` (detail)  | MenuItem |
| Cart & Order   | backend (shared) | `cart` (reuse) + restaurant `checkout` | — |
| Table Reservation | backend  | `reservations`   | Reservation, Table |
| Branch Locator (map) | backend | `branches`     | Branch |
| Promotions     | CMS         | `promotions`     | Promotions (reuse PromoBanners) |
| Gallery        | CMS         | `gallery`        | Gallery |
| Reviews        | backend (shared, flag OFF) | `reviews` (reuse) | Reviews |
| FAQ/About/Contact/Footer | CMS | reuse Phase 1 features | reuse globals |

- **Branch Locator map:** use `react-leaflet` + `leaflet` with OpenStreetMap tiles (free, no API
  key). Map is a `"use client"` leaf.
- **SEO:** use **Restaurant** + **LocalBusiness** JSON-LD (with branch address/geo/openingHours)
  instead of Product/Organization on restaurant pages. Menu items may use `MenuItem`/`Offer`.

## 5. Frontend vertical switch specifics
- `src/components/home/HomeSections.tsx` maps restaurant section keys → restaurant feature
  Sections (menu, promotions, gallery, branches, reservation CTA). Foundation may use
  `PlaceholderSection` until a feature is built.
- `src/components/layout/nav-items.ts` returns restaurant nav (Menu, Reservations, Branches,
  Gallery, About, Contact) when `getSiteType()==="restaurant"`, ecommerce nav otherwise.
- Vertical-specific pages guard on `getSiteType()`:
  - ecommerce-only: `/products`, `/products/[slug]`, `/categories`, `/wishlist` → `notFound()` in restaurant.
  - restaurant-only: `/menu`, `/menu/[slug]`, `/branches`, `/reservations`, `/gallery` → `notFound()` in ecommerce.
  - shared: `/cart`, `/checkout` (vertical body), `/orders/*`, `/search` (vertical results), `/contact`, `/`.

## 6. Validation (proof of generalization)
An automated check boots/loads the app config **twice** (siteType=ecommerce, siteType=restaurant)
and asserts the correct routes/nav/seed appear and the wrong vertical's are absent:
- Backend `VerticalRoutingTests` (`WebApplicationFactory` + `SF_SKIP_DB_INIT=1`, `SF_OPTIONS_FILE`):
  ecommerce boot exposes `/api/v1/products*` and NOT `/api/v1/menu*`; restaurant boot exposes
  `/api/v1/menu*`, `/api/v1/branches*`, `/api/v1/reservations*` and NOT `/api/v1/products*`.
- Frontend: a Vitest test + `scripts/verify-verticals.mjs` asserting each vertical's
  nav/sections/seed expectations from its `options.*.json`.

## 7. Out of scope → leave `// TODO(phase-3):` markers
Bot, factory dashboard, CRM, other verticals, AI orchestration, multi-tenant, real
payment/ZATCA integrations.
