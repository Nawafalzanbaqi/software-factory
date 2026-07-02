import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { isFeatureEnabled } from "@/lib/config";
import type {
  AboutContent,
  BranchContent,
  CmsLocale,
  CmsMedia,
  FaqItem,
  FooterContent,
  GalleryContent,
  HeroContent,
  LocalizedText,
  MenuCategoryContent,
  MenuContent,
  MenuItemContent,
  OpeningHour,
  PromoBanner,
  PromotionContent,
} from "./types";

export * from "./types";

/**
 * CMS fetchers backed by Payload's Local API (getPayload). Every fetcher is GATED
 * by the `cms` feature flag: when CMS is disabled it returns null/[] so features
 * fall back to i18n messages and the site still renders.
 *
 * Localization: we query Payload with `locale: "all"`, which returns every
 * localized field as `{ en, ar }` — exactly the LocalizedText shape the storefront
 * consumes (components pick the active locale). Failures are swallowed to a
 * null/[] fallback so a CMS/DB hiccup never breaks the page.
 *
 * NOTE: signatures are intentionally unchanged from the original stub.
 */

/** Raw (Payload) shape of a localized field when queried with locale "all". */
type MaybeLocalized =
  | string
  | { en?: string | null; ar?: string | null }
  | null
  | undefined;

/** A populated media document (depth >= 1) with a localized `alt`. */
interface RawMedia {
  url?: string | null;
  alt?: MaybeLocalized;
  width?: number | null;
  height?: number | null;
}

/** Coerce a localized-or-plain value into a required LocalizedText. */
function loc(value: MaybeLocalized): LocalizedText {
  if (value && typeof value === "object") {
    return { en: value.en ?? "", ar: value.ar ?? "" };
  }
  const s = typeof value === "string" ? value : "";
  return { en: s, ar: s };
}

/** Like `loc`, but returns undefined when both locales are empty (optional copy). */
function locOpt(value: MaybeLocalized): LocalizedText | undefined {
  if (value == null) return undefined;
  const l = loc(value);
  return l.en || l.ar ? l : undefined;
}

/** Map a populated media relationship to the CmsMedia content type. */
function toMedia(value: unknown): CmsMedia | undefined {
  if (!value || typeof value !== "object") return undefined;
  const m = value as RawMedia;
  if (!m.url) return undefined;
  return {
    url: m.url,
    alt: loc(m.alt),
    width: m.width ?? undefined,
    height: m.height ?? undefined,
  };
}

/**
 * CMS availability gate. In addition to the `cms` feature flag, we skip all
 * Payload/DB access during the production BUILD (prerender) phase and whenever
 * DATABASE_URI is not configured. This keeps headless CI builds green — pages
 * prerender with their i18n fallback content and pick up live CMS copy at runtime
 * (ISR) once a database is reachable — while runtime behavior is unchanged.
 *
 * Rationale: Payload's Postgres pool emits an asynchronous background `error`
 * event on an unreachable DB that escapes per-call try/catch and crashes the
 * Next build worker; gating avoids ever opening that pool without a DB.
 */
async function cmsAvailable(): Promise<boolean> {
  if (process.env.NEXT_PHASE === "phase-production-build") return false;
  if (!process.env.DATABASE_URI) return false;
  return isFeatureEnabled("cms");
}

async function client() {
  return getPayload({ config });
}

export async function getHeroContent(): Promise<HeroContent | null> {
  if (!(await cmsAvailable())) return null;
  try {
    const payload = await client();
    const hero = (await payload.findGlobal({
      slug: "hero",
      locale: "all",
      depth: 1,
    })) as unknown as Record<string, unknown> | null;
    if (!hero) return null;
    return {
      eyebrow: locOpt(hero.eyebrow as MaybeLocalized),
      title: loc(hero.title as MaybeLocalized),
      subtitle: loc(hero.subtitle as MaybeLocalized),
      ctaPrimaryLabel: locOpt(hero.ctaPrimaryLabel as MaybeLocalized),
      ctaPrimaryHref: (hero.ctaPrimaryHref as string) || undefined,
      ctaSecondaryLabel: locOpt(hero.ctaSecondaryLabel as MaybeLocalized),
      ctaSecondaryHref: (hero.ctaSecondaryHref as string) || undefined,
      image: toMedia(hero.image),
    };
  } catch (err) {
    console.error("[cms] getHeroContent failed", err);
    return null;
  }
}

export async function getPromoBanners(): Promise<PromoBanner[]> {
  if (!(await cmsAvailable())) return [];
  try {
    const payload = await client();
    const res = await payload.find({
      collection: "promoBanners",
      where: { enabled: { equals: true } },
      sort: "order",
      locale: "all",
      depth: 1,
      limit: 50,
    });
    return (res.docs as unknown as Record<string, unknown>[]).map((d) => ({
      id: String(d.id),
      title: loc(d.headline as MaybeLocalized),
      href: (d.ctaHref as string) || undefined,
      image: toMedia(d.image),
    }));
  } catch (err) {
    console.error("[cms] getPromoBanners failed", err);
    return [];
  }
}

export async function getFaqItems(): Promise<FaqItem[]> {
  if (!(await cmsAvailable())) return [];
  try {
    const payload = await client();
    const res = await payload.find({
      collection: "faq",
      sort: "order",
      locale: "all",
      depth: 0,
      limit: 100,
    });
    return (res.docs as unknown as Record<string, unknown>[]).map((d) => ({
      id: String(d.id),
      question: loc(d.question as MaybeLocalized),
      answer: loc(d.answer as MaybeLocalized),
    }));
  } catch (err) {
    console.error("[cms] getFaqItems failed", err);
    return [];
  }
}

export async function getAboutContent(): Promise<AboutContent | null> {
  if (!(await cmsAvailable())) return null;
  try {
    const payload = await client();
    const about = (await payload.findGlobal({
      slug: "about",
      locale: "all",
      depth: 1,
    })) as unknown as Record<string, unknown> | null;
    if (!about) return null;
    return {
      title: loc(about.title as MaybeLocalized),
      body: loc(about.body as MaybeLocalized),
      image: toMedia(about.image),
    };
  } catch (err) {
    console.error("[cms] getAboutContent failed", err);
    return null;
  }
}

export async function getFooterContent(): Promise<FooterContent | null> {
  if (!(await cmsAvailable())) return null;
  try {
    const payload = await client();
    const footer = (await payload.findGlobal({
      slug: "footer",
      locale: "all",
      depth: 0,
    })) as unknown as Record<string, unknown> | null;
    if (!footer) return null;
    const columns = Array.isArray(footer.columns) ? footer.columns : [];
    return {
      tagline: locOpt(footer.tagline as MaybeLocalized),
      columns: columns.map((col: Record<string, unknown>) => {
        const links = Array.isArray(col.links) ? col.links : [];
        return {
          title: loc(col.title as MaybeLocalized),
          links: links.map((link: Record<string, unknown>) => ({
            label: loc(link.label as MaybeLocalized),
            href: (link.href as string) || "#",
          })),
        };
      }),
    };
  } catch (err) {
    console.error("[cms] getFooterContent failed", err);
    return null;
  }
}

/* ----------------------------- Restaurant vertical ----------------------------- */
/*
 * New typed fetchers for the restaurant vertical (PHASE2 §3/§4). They follow the
 * exact same rules as the fetchers above: gated by `cmsAvailable()` (cms flag +
 * build-phase/DB guard), and they return null/[] on any failure so headless builds
 * still render i18n fallbacks. `locale` defaults to "all" (bilingual LocalizedText);
 * pass "en"/"ar" to narrow the Payload query to a single locale.
 *
 * TODO(phase-3): multi-tenant — scope these reads by tenant/brand.
 */

/** Map a hasMany media relationship (array of populated docs) to CmsMedia[]. */
function toMediaList(value: unknown): CmsMedia[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => toMedia(v))
    .filter((m): m is CmsMedia => m !== undefined);
}

/** Resolve a relationship field to its id string (populated doc or raw id). */
function relId(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "object") {
    const id = (value as Record<string, unknown>).id;
    return id != null ? String(id) : undefined;
  }
  return String(value);
}

function mapMenuCategory(d: Record<string, unknown>): MenuCategoryContent {
  return {
    id: String(d.id),
    slug: (d.slug as string) ?? "",
    name: loc(d.name as MaybeLocalized),
    description: locOpt(d.description as MaybeLocalized),
    image: toMedia(d.image),
    order: typeof d.order === "number" ? d.order : 0,
  };
}

function mapMenuItem(d: Record<string, unknown>): MenuItemContent {
  return {
    id: String(d.id),
    slug: (d.slug as string) ?? "",
    name: loc(d.name as MaybeLocalized),
    description: locOpt(d.description as MaybeLocalized),
    price: typeof d.price === "number" ? d.price : undefined,
    currency: (d.currency as string) || "SAR",
    categoryId: relId(d.category),
    images: toMediaList(d.images),
    isAvailable: d.isAvailable !== false,
    tags: Array.isArray(d.tags) ? (d.tags as string[]) : [],
    spicyLevel: typeof d.spicyLevel === "number" ? d.spicyLevel : undefined,
    calories: typeof d.calories === "number" ? d.calories : undefined,
  };
}

/** Full menu: categories (ordered) + all available items grouped by categoryId. */
export async function getMenu(locale: CmsLocale = "all"): Promise<MenuContent | null> {
  if (!(await cmsAvailable())) return null;
  try {
    const payload = await client();
    const [cats, items] = await Promise.all([
      payload.find({
        collection: "menuCategories",
        sort: "order",
        locale,
        depth: 1,
        limit: 200,
      }),
      payload.find({
        collection: "menuItems",
        where: { isAvailable: { equals: true } },
        locale,
        depth: 1,
        limit: 500,
      }),
    ]);
    return {
      categories: (cats.docs as unknown as Record<string, unknown>[]).map(
        mapMenuCategory
      ),
      items: (items.docs as unknown as Record<string, unknown>[]).map(mapMenuItem),
    };
  } catch (err) {
    console.error("[cms] getMenu failed", err);
    return null;
  }
}

/** Restaurant branches (with lat/lng + opening hours) for the locator map. */
export async function getBranchesContent(
  locale: CmsLocale = "all"
): Promise<BranchContent[]> {
  if (!(await cmsAvailable())) return [];
  try {
    const payload = await client();
    const res = await payload.find({
      collection: "branches",
      locale,
      depth: 0,
      limit: 200,
    });
    return (res.docs as unknown as Record<string, unknown>[]).map((d) => {
      const hours = Array.isArray(d.openingHours) ? d.openingHours : [];
      return {
        id: String(d.id),
        slug: (d.slug as string) ?? "",
        name: loc(d.name as MaybeLocalized),
        address: locOpt(d.address as MaybeLocalized),
        city: (d.city as string) || undefined,
        latitude: typeof d.latitude === "number" ? d.latitude : undefined,
        longitude: typeof d.longitude === "number" ? d.longitude : undefined,
        phone: (d.phone as string) || undefined,
        openingHours: (hours as Record<string, unknown>[]).map(
          (h): OpeningHour => ({
            day: (h.day as string) ?? "",
            opens: (h.opens as string) || undefined,
            closes: (h.closes as string) || undefined,
            closed: h.closed === true,
          })
        ),
      };
    });
  } catch (err) {
    console.error("[cms] getBranchesContent failed", err);
    return [];
  }
}

/** Gallery blocks (enabled, ordered), each with its ordered images. */
export async function getGallery(
  locale: CmsLocale = "all"
): Promise<GalleryContent[]> {
  if (!(await cmsAvailable())) return [];
  try {
    const payload = await client();
    const res = await payload.find({
      collection: "gallery",
      where: { enabled: { equals: true } },
      sort: "order",
      locale,
      depth: 1,
      limit: 100,
    });
    return (res.docs as unknown as Record<string, unknown>[]).map((d) => ({
      id: String(d.id),
      title: loc(d.title as MaybeLocalized),
      images: toMediaList(d.images),
    }));
  } catch (err) {
    console.error("[cms] getGallery failed", err);
    return [];
  }
}

/** Restaurant promotions (enabled, ordered). Mirrors the PromoBanner mapping. */
export async function getPromotions(
  locale: CmsLocale = "all"
): Promise<PromotionContent[]> {
  if (!(await cmsAvailable())) return [];
  try {
    const payload = await client();
    const res = await payload.find({
      collection: "promotions",
      where: { enabled: { equals: true } },
      sort: "order",
      locale,
      depth: 1,
      limit: 50,
    });
    return (res.docs as unknown as Record<string, unknown>[]).map((d) => ({
      id: String(d.id),
      title: loc(d.headline as MaybeLocalized),
      subtitle: locOpt(d.subcopy as MaybeLocalized),
      ctaLabel: locOpt(d.ctaLabel as MaybeLocalized),
      href: (d.ctaHref as string) || undefined,
      image: toMedia(d.image),
    }));
  } catch (err) {
    console.error("[cms] getPromotions failed", err);
    return [];
  }
}
