import { Suspense, type ReactNode } from "react";
import { getEnabledSections } from "@/lib/config/options";
import { HeroSection } from "@/features/hero";
import type { SectionName } from "@/lib/config/types";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Config-driven homepage composition. Renders getEnabledSections() in `order`.
 *
 * The hero (above the fold) is imported eagerly. Every other section is loaded via
 * a per-section async `import()` (code-split by the bundler) inside an async
 * Server Component wrapped in <Suspense>, so below-the-fold work is streamed and
 * never blocks first paint. `footer` is excluded — the root layout renders it.
 *
 * Each section key maps to a real feature Section (barrel-exported). Any enabled
 * key without a mapping falls back to PlaceholderSection so the page never breaks.
 * Note: `reviews` is disabled in options.json today (sections.reviews.enabled =
 * false) so it is filtered out by getEnabledSections and does NOT render.
 *
 * Phase 2: the active vertical is chosen by siteType in the loaded options file
 * (getEnabledSections already returns whichever vertical's sections are enabled).
 * Restaurant feature Sections (menu, promotions, gallery, branches, reservation)
 * are wired below to their real feature barrels; each Section self-gates on its
 * own section/feature flag and renders null when disabled or empty.
 */

function SectionFallback() {
  return (
    <div className="container section-y" aria-hidden="true">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-6 h-40 w-full" />
    </div>
  );
}

/** Async wrapper that dynamically imports + renders one below-the-fold section. */
async function LazySection({ name }: { name: SectionName }) {
  switch (name) {
    case "promoBanners": {
      const { PromoBannersSection } = await import("@/features/promo-banners");
      return <PromoBannersSection />;
    }
    case "categories": {
      const { CategoriesSection } = await import("@/features/categories");
      return <CategoriesSection />;
    }
    case "productListing": {
      const { FeaturedProductsSection } = await import(
        "./sections/FeaturedProductsSection"
      );
      return <FeaturedProductsSection />;
    }
    case "reviews": {
      const { ReviewsSection } = await import("@/features/reviews");
      return <ReviewsSection />;
    }
    case "about": {
      const { AboutSection } = await import("@/features/about");
      return <AboutSection />;
    }
    case "faq": {
      const { FaqSection } = await import("@/features/faq");
      return <FaqSection />;
    }
    case "contact": {
      const { ContactSection } = await import("@/features/contact");
      return <ContactSection />;
    }
    // --- Restaurant vertical (Phase 2) ---------------------------------------
    // Each restaurant feature Section is barrel-exported from its feature and
    // self-gates on its own section/feature flag (returns null when disabled or
    // when its data source is empty).
    case "menu": {
      const { MenuSection } = await import("@/features/menu");
      return <MenuSection />;
    }
    case "promotions": {
      const { PromotionsSection } = await import("@/features/promotions");
      return <PromotionsSection />;
    }
    case "gallery": {
      const { GallerySection } = await import("@/features/gallery");
      return <GallerySection />;
    }
    case "branches": {
      const { BranchesSection } = await import("@/features/branches");
      return <BranchesSection />;
    }
    case "reservation": {
      const { ReservationSection } = await import("@/features/reservations");
      return <ReservationSection />;
    }
    default: {
      // Fallback for any enabled section key without a feature mapping.
      const { PlaceholderSection } = await import("./sections/PlaceholderSection");
      return <PlaceholderSection id={name} namespace="sections" titleKey={name} />;
    }
  }
}

export async function HomeSections() {
  const sections = await getEnabledSections();

  const nodes: ReactNode[] = [];
  for (const { name } of sections) {
    if (name === "footer") continue; // rendered by layout
    if (name === "hero") {
      nodes.push(<HeroSection key="hero" />);
      continue;
    }
    nodes.push(
      <Suspense key={name} fallback={<SectionFallback />}>
        <LazySection name={name} />
      </Suspense>,
    );
  }

  return <>{nodes}</>;
}
