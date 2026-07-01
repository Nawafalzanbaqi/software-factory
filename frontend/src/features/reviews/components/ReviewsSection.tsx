import { getTranslations } from "next-intl/server";
import { isFeatureEnabled, isSectionEnabled } from "@/lib/config/options";
import type { ReviewDto } from "@/lib/api/types";
import { ReviewCard } from "./ReviewCard";

/**
 * Homepage "featured reviews" Section (sectionKey: "reviews").
 *
 * DEMONSTRATES THE FEATURE-FLAG PATTERN: this section is DISABLED in options.json
 * (sections.reviews.enabled = false AND features.reviews = false), so it returns
 * null and renders nothing — the code ships but does not appear. Flip both flags on
 * to activate it. HomeSections also filters disabled sections out of the homepage;
 * this self-gate makes the component safe to mount anywhere.
 *
 * TODO (backlog): source the featured reviews from a curated CMS list or an
 * aggregate endpoint (e.g. GET /reviews/featured) — there is no cross-product
 * reviews endpoint in the Phase 1 REST contract (ARCHITECTURE.md §2), so with no
 * data source available the section degrades to nothing when enabled.
 */
export async function ReviewsSection({
  reviews = [],
}: {
  /** Curated featured reviews, supplied once a data source exists. */
  reviews?: ReviewDto[];
} = {}) {
  // Both the section flag and the feature flag must be on for this to render.
  if (!(await isSectionEnabled("reviews"))) return null;
  if (!(await isFeatureEnabled("reviews"))) return null;

  if (reviews.length === 0) return null;

  const t = await getTranslations("reviews");

  return (
    <section aria-labelledby="featured-reviews-heading" className="container section-y">
      <div className="mb-8 text-center">
        <h2
          id="featured-reviews-heading"
          className="font-display text-2xl font-semibold sm:text-3xl"
        >
          {t("section.title")}
        </h2>
        <p className="mt-3 text-muted-foreground">{t("section.subtitle")}</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <li key={review.id}>
            <ReviewCard review={review} />
          </li>
        ))}
      </ul>
    </section>
  );
}
