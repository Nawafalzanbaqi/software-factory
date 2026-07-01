"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePromoCarousel } from "../hooks/usePromoCarousel";
import { PromoBannerSlide } from "./PromoBannerSlide";
import type { PromoBannerView } from "../types";

/**
 * Interactive carousel leaf (embla). Accessible per WAI-ARIA carousel pattern:
 * the region carries `aria-roledescription="carousel"`, each slide is a labelled
 * group, and prev/next + dot controls are labelled buttons with visible focus.
 * Controls are hidden for a single banner. Direction (RTL/LTR) is driven by locale
 * so the swipe/scroll axis matches the page.
 *
 * TODO (backlog): optional autoplay (embla-carousel-autoplay) gated on
 * prefers-reduced-motion; wire promo impression/click analytics.
 */
export function PromoBannersCarousel({
  banners,
  direction,
}: {
  banners: PromoBannerView[];
  direction: "rtl" | "ltr";
}) {
  const t = useTranslations("promoBanners");
  const multiple = banners.length > 1;
  const {
    emblaRef,
    selectedIndex,
    scrollSnaps,
    scrollPrev,
    scrollNext,
    scrollTo,
  } = usePromoCarousel({
    loop: multiple,
    align: "center",
    direction,
    containScroll: "trimSnaps",
  });

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription={t("carousel")}
      aria-label={t("regionLabel")}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {banners.map((banner, index) => (
            <PromoBannerSlide
              key={banner.id}
              banner={banner}
              index={index}
              total={banners.length}
              slideLabel={t("slide")}
              ctaLabel={t("cta")}
            />
          ))}
        </div>
      </div>

      {multiple && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={scrollPrev}
            aria-label={t("previous")}
            className="absolute top-1/2 start-3 size-10 -translate-y-1/2 rounded-full bg-background/80 shadow-sm backdrop-blur hover:bg-background"
          >
            <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={scrollNext}
            aria-label={t("next")}
            className="absolute top-1/2 end-3 size-10 -translate-y-1/2 rounded-full bg-background/80 shadow-sm backdrop-blur hover:bg-background"
          >
            <ChevronRight className="size-5 rtl:rotate-180" aria-hidden="true" />
          </Button>

          <div
            className="mt-4 flex items-center justify-center gap-2"
            role="group"
            aria-label={t("dotsLabel")}
          >
            {scrollSnaps.map((_, index) => {
              const active = index === selectedIndex;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => scrollTo(index)}
                  aria-label={t("goToSlide", { index: index + 1 })}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "w-6 bg-primary"
                      : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70",
                  )}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
