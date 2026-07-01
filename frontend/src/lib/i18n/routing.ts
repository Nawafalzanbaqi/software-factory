import { defineRouting } from "next-intl/routing";

/**
 * Central i18n routing definition. Locales and default are aligned with the root
 * options.json (defaultLocale: "ar", defaultDirection: "rtl").
 *
 * localePrefix "as-needed": the default locale (ar) is served without a prefix,
 * non-default locales (en) are prefixed (/en/...). Middleware negotiates the rest.
 */
export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

/** Text direction per locale — consumed by <html dir> and RTL-aware components. */
export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export function getDirection(locale: string): "rtl" | "ltr" {
  return localeDirection[locale as Locale] ?? "ltr";
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});
