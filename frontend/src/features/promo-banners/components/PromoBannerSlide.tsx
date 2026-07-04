import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PromoBannerView } from "../types";

/**
 * Presentational carousel slide (no client state — rendered inside the client
 * carousel). Full-bleed CMS image with an overlaid headline + CTA. When the banner
 * has an `href` the whole slide is a single locale-aware link (the CTA is a visual
 * affordance, not a nested link, to keep the slide a11y-clean).
 */
export function PromoBannerSlide({
  banner,
  index,
  total,
  slideLabel,
  ctaLabel,
}: {
  banner: PromoBannerView;
  index: number;
  total: number;
  /** Localized aria-roledescription for a single slide, e.g. "slide". */
  slideLabel: string;
  /** Localized CTA label (generic — CMS has no per-banner CTA yet). */
  ctaLabel: string;
}) {
  const media = (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-muted sm:aspect-[21/9]">
      {banner.image ? (
        <Image
          src={banner.image.url}
          alt={banner.image.alt}
          fill
          // Below the fold (section order 2) — lazy by default for a lean LCP.
          sizes="100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        // Fallback visual until CMS media is available. Decorative gradient.
        <div
          className="size-full bg-gradient-to-br from-accent/25 via-secondary to-primary/10"
          role="img"
          aria-label={banner.headline}
        />
      )}

      {/* Legibility scrim behind the copy. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-5 sm:p-8">
        <h3 className="max-w-xl text-balance font-display text-xl font-semibold text-background drop-shadow-sm sm:text-3xl">
          {banner.headline}
        </h3>
        {banner.href && (
          // Gold CTA — the single accent pop per slide (accent-foreground on
          // accent is ≥4.5:1). Visual affordance only; the slide is the link.
          <span
            className={cn(
              buttonVariants({ size: "sm" }),
              "pointer-events-none bg-accent text-accent-foreground shadow-md",
            )}
          >
            {ctaLabel}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="min-w-0 flex-[0_0_100%] px-1"
      role="group"
      aria-roledescription={slideLabel}
      aria-label={`${index + 1} / ${total}`}
    >
      {banner.href ? (
        <Link
          href={banner.href}
          className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {media}
        </Link>
      ) : (
        <div className="group block">{media}</div>
      )}
    </div>
  );
}
