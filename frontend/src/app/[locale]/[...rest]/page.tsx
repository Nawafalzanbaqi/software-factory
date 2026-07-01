import { notFound } from "next/navigation";

/**
 * Catch-all for unknown paths within a locale. Delegates to the localized
 * not-found (app/[locale]/not-found.tsx) so 404s keep the header/footer + i18n.
 * This also lets us avoid a separate non-localized root not-found (which would
 * require its own root layout).
 */
export default function CatchAllNotFound() {
  notFound();
}
