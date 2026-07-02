import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildProductJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/lib/seo/json-ld";
import { productsApi, ProductDetail, localizeProduct } from "@/features/products";
import { ProductReviews } from "@/features/reviews";
import { getSiteType, isFeatureEnabled } from "@/lib/config/options";
import type { ProductDto } from "@/lib/api/types";

// SSG + ISR: pre-render known product pages, revalidate periodically.
export const revalidate = 600;
// Allow on-demand rendering for slugs not in generateStaticParams.
export const dynamicParams = true;

/** Pre-build product pages for every locale × slug. */
export async function generateStaticParams() {
  const slugs = await productsApi.allSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

async function fetchProduct(slug: string): Promise<ProductDto | null> {
  try {
    return await productsApi.getBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) {
    return buildMetadata({
      locale,
      title: "Not found",
      description: "",
      path: `/products/${slug}`,
      noIndex: true,
    });
  }
  const { name, description } = localizeProduct(product, locale);
  return buildMetadata({
    locale,
    title: name,
    description,
    path: `/products/${slug}`,
    images: product.images,
    type: "product",
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  // Ecommerce-only route.
  if ((await getSiteType()) !== "ecommerce") notFound();

  const product = await fetchProduct(slug);
  if (!product) notFound();

  const reviewsEnabled = await isFeatureEnabled("reviews");

  return (
    <div className="container section-y space-y-12">
      <JsonLd data={buildProductJsonLd(product, locale)} />
      <ProductDetail product={product} />
      {reviewsEnabled && <ProductReviews productId={product.id} />}
    </div>
  );
}
