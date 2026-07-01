import { getTranslations } from "next-intl/server";
import { isFeatureEnabled } from "@/lib/config/options";
import { Separator } from "@/components/ui/separator";
import type { ReviewDto } from "@/lib/api/types";
import { reviewsApi } from "../api/reviewsApi";
import { getAverageRating } from "../types";
import { StarRating } from "./StarRating";
import { ReviewList } from "./ReviewList";
import { ReviewForm } from "./ReviewForm";

/**
 * Server Component reviews block for the product detail page. Fetches reviews via
 * the api client (short ISR), shows the average + count summary and the list, then
 * the interactive ReviewForm client leaf.
 *
 * Self-gated by the `reviews` feature flag (options.json features.reviews, OFF by
 * default): renders nothing when the flag is off, so it is safe to mount even
 * before the integrator adds the flag guard. On backend failure it degrades to an
 * empty list rather than throwing.
 */
export async function ProductReviews({ productId }: { productId: string }) {
  // Feature-flag gate (ARCHITECTURE.md §0 features.reviews). Renders nothing when off.
  if (!(await isFeatureEnabled("reviews"))) return null;

  const t = await getTranslations("reviews");

  let reviews: ReviewDto[] = [];
  try {
    reviews = await reviewsApi.list(productId);
  } catch {
    reviews = [];
  }

  const average = getAverageRating(reviews);

  return (
    <section aria-labelledby="reviews-heading" className="space-y-6">
      <div className="space-y-2">
        <h2 id="reviews-heading" className="font-display text-2xl font-semibold">
          {t("title")}
        </h2>
        {reviews.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <StarRating
              rating={average}
              label={t("starsAria", { rating: average })}
            />
            <span className="text-sm font-medium tabular-nums">
              {t("summary.average", { rating: average.toFixed(1) })}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("summary.count", { count: reviews.length })}
            </span>
          </div>
        )}
      </div>

      <ReviewList reviews={reviews} />

      <Separator />

      <ReviewForm productId={productId} />
    </section>
  );
}
