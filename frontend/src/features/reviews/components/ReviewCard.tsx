import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import type { ReviewDto } from "@/lib/api/types";
import { StarRating } from "./StarRating";

/**
 * Server Component review card. Presentational only. Renders the star rating,
 * title, body, author and localized date. Shared by ReviewList (product detail)
 * and ReviewsSection (homepage featured reviews).
 */
export async function ReviewCard({ review }: { review: ReviewDto }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("reviews");

  let date = review.createdAt;
  try {
    date = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(review.createdAt));
  } catch {
    /* fall back to the raw ISO string */
  }

  return (
    <article className="space-y-3 rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <StarRating
          rating={review.rating}
          size="sm"
          label={t("starsAria", { rating: review.rating })}
        />
        <time dateTime={review.createdAt} className="text-xs text-muted-foreground">
          {date}
        </time>
      </div>
      <div className="space-y-1">
        <h4 className="font-medium">{review.title}</h4>
        <p className="text-sm leading-relaxed text-muted-foreground">{review.body}</p>
      </div>
      <p className="text-sm font-medium">{review.author}</p>
    </article>
  );
}
