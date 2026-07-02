import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteType } from "@/lib/config/options";
import { categoriesApi, CategoryGrid } from "@/features/categories";
import type { CategoryDto } from "@/features/categories";

// ISR: the page shell is static; categoriesApi sets its own (longer) revalidate
// window since the taxonomy is slow-moving reference data.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "categories" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("subtitle"),
    path: "/categories",
  });
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Ecommerce-only route.
  if ((await getSiteType()) !== "ecommerce") notFound();
  const t = await getTranslations("categories");

  let categories: CategoryDto[] = [];
  try {
    categories = await categoriesApi.list();
  } catch {
    categories = [];
  }

  return (
    <div className="container section-y">
      <section aria-labelledby="categories-page-heading" className="space-y-6">
        <div>
          <h1
            id="categories-page-heading"
            className="font-display text-2xl font-semibold"
          >
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <CategoryGrid categories={categories} />
      </section>
    </div>
  );
}
