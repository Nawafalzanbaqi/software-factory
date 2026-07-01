"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { RATING_MAX } from "../types";

/**
 * Interactive star-rating input (client leaf). Built on native radio inputs for
 * free keyboard support (arrow keys) and correct radiogroup semantics; the visible
 * stars are aria-hidden and each option carries an sr-only localized label. Hover
 * and keyboard focus preview the rating. Controlled — designed to be driven by a
 * react-hook-form <Controller>.
 */
export function StarRatingInput({
  value,
  onChange,
  name,
  getOptionLabel,
  max = RATING_MAX,
  disabled,
  invalid,
  ariaLabelledBy,
  describedById,
}: {
  value: number;
  onChange: (value: number) => void;
  name: string;
  /** Localized label per option, e.g. (3) => "3 stars". */
  getOptionLabel: (value: number) => string;
  max?: number;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabelledBy?: string;
  describedById?: string;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div
      role="radiogroup"
      aria-labelledby={ariaLabelledBy}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={describedById}
      className="inline-flex items-center gap-1"
      onMouseLeave={() => setHovered(0)}
    >
      {Array.from({ length: max }, (_, i) => {
        const optionValue = i + 1;
        const filled = optionValue <= active;
        return (
          <label
            key={optionValue}
            className={cn(
              "cursor-pointer rounded-sm p-0.5",
              disabled && "cursor-not-allowed opacity-50",
            )}
            onMouseEnter={() => !disabled && setHovered(optionValue)}
          >
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={value === optionValue}
              disabled={disabled}
              onChange={() => onChange(optionValue)}
              onFocus={() => setHovered(optionValue)}
              onBlur={() => setHovered(0)}
              className="peer sr-only"
            />
            <Star
              aria-hidden="true"
              className={cn(
                "size-7 transition-colors",
                filled
                  ? "fill-accent text-accent"
                  : "fill-none text-muted-foreground/40",
                "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-focus-visible:rounded-sm",
              )}
            />
            <span className="sr-only">{getOptionLabel(optionValue)}</span>
          </label>
        );
      })}
    </div>
  );
}
