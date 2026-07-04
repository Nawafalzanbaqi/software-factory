import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAboutContent } from "@/lib/cms";
import type { Locale } from "@/lib/i18n/routing";
import { localizeAbout, toParagraphs } from "../types";

/**
 * About Section (Server Component, options.json sectionKey "about"). Copy is
 * CMS-driven (Payload `about` global via lib/cms) with a graceful fallback to i18n
 * messages while the CMS stub returns null. No copy is hardcoded in JSX — every
 * string comes from CMS or the "about" messages namespace.
 *
 * Used in two places (mirrors the ContactSection pattern):
 *  - variant "section" — the homepage section (h2, teaser + "read more" CTA).
 *  - variant "page"    — the /about page body (h1, full content, no CTA).
 *
 * Section gating is handled upstream by HomeSections/getEnabledSections — this
 * feature has no dedicated feature flag (flag-gate: none), so it does not
 * self-gate, matching HeroSection / CategoriesSection.
 */
export async function AboutSection({
  variant = "section",
}: {
  variant?: "section" | "page";
} = {}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("about");
  const cms = await getAboutContent();
  const localized = cms ? localizeAbout(cms, locale) : null;

  const isPage = variant === "page";
  const Heading = isPage ? "h1" : "h2";

  const title = localized?.title ?? t("title");
  const paragraphs =
    localized && localized.paragraphs.length > 0
      ? localized.paragraphs
      : toParagraphs(t("body"));
  const imageUrl = localized?.imageUrl;
  const imageAlt = localized?.imageAlt ?? t("imageAlt");

  // One markup tree for both variants: the homepage ("section") variant adds the
  // gold kicker, wider desktop gaps and a softer image treatment; the /about page
  // keeps its original presentation. Band backgrounds come from HomeSections.
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="container section-y"
    >
      <div
        className={cn("grid items-center gap-10 lg:grid-cols-2", !isPage && "lg:gap-16")}
      >
        <div className="max-w-xl">
          {!isPage && <div aria-hidden="true" className="kicker mb-4" />}
          <Heading
            id="about-heading"
            className="font-display text-2xl font-semibold sm:text-3xl"
          >
            {title}
          </Heading>
          <div className="mt-4 space-y-4 text-muted-foreground">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
          {!isPage && (
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link href="/about">
                  {t("readMore")}
                  <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden border bg-muted shadow-premium",
            isPage ? "rounded-xl" : "rounded-2xl ring-1 ring-border/60",
          )}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              // Homepage section sits below the fold; the /about page hero is eager.
              loading={isPage ? "eager" : "lazy"}
            />
          ) : (
            // Decorative gradient fallback until CMS media is available.
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
