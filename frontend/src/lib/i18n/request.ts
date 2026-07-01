import { getRequestConfig } from "next-intl/server";
import { routing, isLocale } from "./routing";

/**
 * Per-request i18n config consumed by the next-intl plugin (see next.config.ts).
 * Resolves the active locale from the [locale] segment and loads its message
 * catalog. Falls back to the default locale for unknown values.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
