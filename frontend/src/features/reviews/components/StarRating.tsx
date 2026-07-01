import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { RATING_MAX } from "../types";

const SIZE_CLASS = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
} as const;

/**
 * Read-only star rating display. Pure presentational (no hooks / no data), so it
 * is safe in both Server and Client Components. Stars are aria-hidden; the numeric
 * value is exposed to assistive tech via the `label` prop (already localized by
 * the caller). Filled up to the rounded rating.
 */
export function StarRating({
  rating,
  max = RATING_MAX,
  size = "md",
  label,
  className,
}: {
  rating: number;
  max?: number;
  size?: keyof typeof SIZE_CLASS;
  /** Localized accessible label, e.g. "Rated 4 out of 5". */
  label?: string;
  className?: string;
}) {
  const rounded = Math.round(rating);

  return (
    <span
      role="img"
      aria-label={label ?? `${rating} / ${max}`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(
            SIZE_CLASS[size],
            i < rounded
              ? "fill-accent text-accent"
              : "fill-none text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}
