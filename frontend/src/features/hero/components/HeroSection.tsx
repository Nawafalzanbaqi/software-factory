import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getHeroContent } from "@/lib/cms";
import type { Locale } from "@/lib/i18n/routing";

/**
 * Hero Section (Server Component). Copy is CMS-driven (Payload `hero` global) with
 * a graceful fallback to i18n messages while the CMS stub returns null. No copy is
 * hardcoded in JSX — everything comes from CMS or messages.
 */
export async function HeroSection() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("hero");
  const cms = await getHeroContent();

  const eyebrow = cms?.eyebrow?.[locale] ?? t("eyebrow");
  const title = cms?.title?.[locale] ?? t("title");
  const subtitle = cms?.subtitle?.[locale] ?? t("subtitle");
  const ctaPrimaryLabel = cms?.ctaPrimaryLabel?.[locale] ?? t("ctaPrimary");
  const ctaPrimaryHref = cms?.ctaPrimaryHref ?? "/products";
  const ctaSecondaryLabel = cms?.ctaSecondaryLabel?.[locale] ?? t("ctaSecondary");
  const ctaSecondaryHref = cms?.ctaSecondaryHref ?? "/categories";
  const imageAlt = cms?.image?.alt?.[locale] ?? t("imageAlt");
  const imageUrl = cms?.image?.url;

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b bg-gradient-to-b from-secondary/60 to-background"
    >
      <div className="container grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
        <div className="max-w-xl animate-fade-in">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-accent">
            {eyebrow}
          </p>
          <h1
            id="hero-heading"
            className="font-display text-4xl font-semibold leading-tight sm:text-5xl"
          >
            {title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={ctaPrimaryHref}>
                {ctaPrimaryLabel}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={ctaSecondaryHref}>{ctaSecondaryLabel}</Link>
            </Button>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted shadow-premium">
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
              className="size-full bg-gradient-to-br from-accent/25 via-secondary to-primary/10"
              role="img"
              aria-label={imageAlt}
            />
          )}
        </div>
      </div>
    </section>
  );
}
