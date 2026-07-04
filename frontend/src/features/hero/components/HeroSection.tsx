import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getHeroContent } from "@/lib/cms";
import { isVertical } from "@/lib/config/options";
import type { Locale } from "@/lib/i18n/routing";

/**
 * Hero Section (Server Component). Copy is CMS-driven (Payload `hero` global) with
 * a graceful fallback to i18n messages while the CMS stub returns null. No copy is
 * hardcoded in JSX — everything comes from CMS or messages. Fallbacks use `||`
 * (not `??`) because a partially-localized CMS field arrives as an EMPTY STRING
 * for the missing locale and must still fall back.
 *
 * Visual system: warm premium minimalism — gold eyebrow pill (accent-strong text,
 * ≥4.5:1 on this background), oversized balanced display title, and a trust strip
 * that answers delivery/payment/returns above the fold. Supporting copy gets a
 * staggered fade-in; the h1 stays static so the LCP candidate is never painted
 * invisible (the global reduced-motion override also zeroes duration + delay).
 * Letter-spacing is applied via `ltr:` only — tracking breaks connected Arabic.
 */
export async function HeroSection() {
  const [locale, t, cms, isEcommerce] = await Promise.all([
    getLocale() as Promise<Locale>,
    getTranslations("hero"),
    getHeroContent(),
    isVertical("ecommerce"),
  ]);

  const eyebrow = cms?.eyebrow?.[locale] || t("eyebrow");
  const title = cms?.title?.[locale] || t("title");
  const subtitle = cms?.subtitle?.[locale] || t("subtitle");
  const ctaPrimaryLabel = cms?.ctaPrimaryLabel?.[locale] || t("ctaPrimary");
  const ctaPrimaryHref = cms?.ctaPrimaryHref || "/products";
  const ctaSecondaryLabel = cms?.ctaSecondaryLabel?.[locale] || t("ctaSecondary");
  const ctaSecondaryHref = cms?.ctaSecondaryHref || "/categories";
  const imageAlt = cms?.image?.alt?.[locale] || t("imageAlt");
  const imageUrl = cms?.image?.url;

  // Delivery/returns/checkout facts are ecommerce copy — hide the strip on other
  // verticals (the hero is shared foundation; restaurant renders it too).
  // TODO (Payload agent): expose these as localized fields on the `hero` global
  // (per-client SLAs differ) with these messages as the fallback — mirrors the
  // eyebrow/title pattern above.
  const trustItems = isEcommerce
    ? [
        { Icon: Truck, label: t("trustDelivery") },
        { Icon: ShieldCheck, label: t("trustPayment") },
        { Icon: RotateCcw, label: t("trustReturns") },
      ]
    : [];

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b bg-gradient-to-b from-secondary/70 via-background to-background"
    >
      {/* Ambient wash — decorative only (single layer; large blurs paint dearly). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 end-[-8rem] size-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:py-28">
        <div className="max-w-xl">
          <p className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase text-accent-strong ltr:tracking-wider">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1
            id="hero-heading"
            className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-6xl"
          >
            {title}
          </h1>
          <p className="mt-5 max-w-prose animate-fade-in text-pretty text-lg leading-relaxed text-muted-foreground [animation-delay:75ms]">
            {subtitle}
          </p>
          <div className="mt-8 flex animate-fade-in flex-wrap gap-3 [animation-delay:150ms]">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href={ctaPrimaryHref}>
                {ctaPrimaryLabel}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
              <Link href={ctaSecondaryHref}>{ctaSecondaryLabel}</Link>
            </Button>
          </div>

          {/* Trust strip — the Gulf-commerce conversion staple (delivery, secure
              payment, returns). Copy mirrors the FAQ facts via i18n messages. */}
          {trustItems.length > 0 && (
            <ul className="mt-10 grid animate-fade-in gap-3 border-t pt-6 text-sm text-muted-foreground [animation-delay:225ms] sm:grid-cols-3">
              {trustItems.map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-strong">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-accent/15 via-transparent to-secondary/60 blur-2xl"
          />
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted shadow-premium ring-1 ring-border/60">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              // Fallback visual until CMS media is available. Decorative gradient.
              <div
                className="size-full bg-gradient-to-br from-accent/30 via-secondary to-primary/10"
                role="img"
                aria-label={imageAlt}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
