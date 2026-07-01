import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { HomeSections } from "@/components/home/HomeSections";

/**
 * Homepage — renders the config-enabled sections in order (see HomeSections).
 * Statically rendered per locale; sections revalidate via their own ISR settings.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeSections />;
}
