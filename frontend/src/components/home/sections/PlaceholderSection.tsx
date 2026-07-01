import { getTranslations } from "next-intl/server";

/**
 * Generic titled section shell. The SECOND agent replaces each of these with a
 * real feature Section (categories, promoBanners, about, faq, contact, reviews),
 * self-contained under src/features/<name>/. Copy comes from messages/CMS — never
 * hardcoded here.
 *
 * TODO (second agent): implement dedicated feature sections and register them in
 * src/components/home/HomeSections.tsx.
 */
export async function PlaceholderSection({
  namespace,
  titleKey = "title",
  subtitleKey,
  id,
}: {
  /** i18n namespace, e.g. "faq" | "about" | "contact" | "sections". */
  namespace: string;
  titleKey?: string;
  subtitleKey?: string;
  id: string;
}) {
  const t = await getTranslations(namespace);
  const subtitle = subtitleKey && t.has(subtitleKey) ? t(subtitleKey) : undefined;

  return (
    <section aria-labelledby={`${id}-heading`} className="container section-y">
      <h2 id={`${id}-heading`} className="font-display text-2xl font-semibold">
        {t(titleKey)}
      </h2>
      {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
    </section>
  );
}
