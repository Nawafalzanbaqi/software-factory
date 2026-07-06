import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ShieldCheck, Star } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { getSiteConfig } from "@/lib/config/options";
import { resolvePaymentMethods } from "@/lib/config/payments";
import type { Locale } from "@/lib/i18n/routing";
import type { ProductDto } from "@/lib/api/types";
import { localizeProduct } from "../types";
import { ProductPurchasePanel } from "./ProductPurchasePanel";

/**
 * Server Component product detail. Static content (images, copy, price) renders on
 * the server; the quantity + add-to-cart controls are an interactive client leaf
 * (ProductPurchasePanel). Payment-method chips are config-driven (options.json
 * `payments`) and reuse the checkout method labels — no copy is hardcoded.
 */
export async function ProductDetail({ product }: { product: ProductDto }) {
  const locale = (await getLocale()) as Locale;
  const [t, tCheckout, site] = await Promise.all([
    getTranslations("products"),
    getTranslations("checkout"),
    getSiteConfig(),
  ]);
  const { name, description } = localizeProduct(product, locale);
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const hero = product.images[0] ?? "/placeholder.svg";
  // Same resolver checkout uses (whitelist + dedupe + COD fallback) so the
  // detail page never advertises a different payment set than checkout accepts.
  const paymentMethods = resolvePaymentMethods(site.payments);

  return (
    <article className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted shadow-premium ring-1 ring-border/60">
          <Image
            src={hero}
            alt={name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        {product.images.length > 1 && (
          <ul className="grid grid-cols-4 gap-3">
            {product.images.slice(0, 4).map((src, i) => (
              <li
                key={src}
                className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
              >
                <Image
                  src={src}
                  alt={`${name} ${i + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {t("backToProducts")}
          </Link>
          <h1 className="text-balance font-display text-3xl font-semibold sm:text-4xl">
            {name}
          </h1>
          <div className="flex items-center gap-3">
            {product.rating != null && (
              <span className="inline-flex items-center gap-1 text-sm">
                <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
                <span className="tabular-nums">{product.rating.toFixed(1)}</span>
                <span className="sr-only">{t("rating")}</span>
              </span>
            )}
            <Badge variant={product.inStock ? "secondary" : "outline"}>
              {product.inStock ? t("inStock") : t("outOfStock")}
            </Badge>
          </div>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold tabular-nums">
            {formatPrice(product.price, product.currency, locale)}
          </span>
          {onSale && (
            <span className="text-lg text-muted-foreground line-through tabular-nums">
              {formatPrice(product.compareAtPrice!, product.currency, locale)}
            </span>
          )}
        </div>

        {/* Purchase area on a warm panel — the page's single conversion focus. */}
        <div className="rounded-2xl border bg-secondary/40 p-4 sm:p-5">
          <ProductPurchasePanel
            product={{
              id: product.id,
              slug: product.slug,
              nameEn: product.nameEn,
              nameAr: product.nameAr,
              price: product.price,
              currency: product.currency,
              imageUrl: hero,
            }}
            inStock={product.inStock}
          />
          {/* Always non-empty: the resolver appends the COD fallback, matching
              exactly what checkout will offer. */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
            <ShieldCheck
              className="size-4 shrink-0 text-accent-strong"
              aria-hidden="true"
            />
            <ul
              aria-label={tCheckout("form.paymentHeading")}
              className="flex flex-wrap items-center gap-2"
            >
              {paymentMethods.map((method) => (
                <li key={method}>
                  <Badge variant="secondary">
                    {tCheckout(`payment.methods.${method}.label`)}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* TODO (backlog): payment provider widgets (tamara/tabi installment estimates). */}

        <Separator />

        <div className="space-y-2">
          <h2 className="font-medium">{t("description")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        {product.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="outline">{tag}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
