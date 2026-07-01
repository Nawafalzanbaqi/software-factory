import { getTranslations } from "next-intl/server";
import type { ReviewDto } from "@/lib/api/types";
import { ReviewCard } from "./ReviewCard";

/**
 * Server Component list of product reviews. Renders an empty state (i18n) when
 * there are none so first-time products still read well.
 */
export async function ReviewList({ reviews }: { reviews: ReviewDto[] }) {
  const t = await getTranslations("reviews");

  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li key={review.id}>
          <ReviewCard review={review} />
        </li>
      ))}
    </ul>
  );
}
