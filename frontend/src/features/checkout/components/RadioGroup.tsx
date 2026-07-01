import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Feature-local radio-group primitive (the shared shadcn kit has none). Built on
 * NATIVE radio inputs for maximum accessibility: keyboard arrow navigation, group
 * semantics and screen-reader support come for free. `RadioGroup` is the labelled
 * container; `RadioGroupItem` is a card-styled option that forwards its ref so
 * react-hook-form's register() (which returns a shared name/ref for the group) can
 * bind every option.
 */

export type RadioGroupProps = React.HTMLAttributes<HTMLDivElement>;

export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return <div role="radiogroup" className={cn("grid gap-3", className)} {...props} />;
}

export interface RadioGroupItemProps extends React.ComponentProps<"input"> {
  /** Visible option label. */
  label: string;
  /** Optional supporting copy shown under the label. */
  description?: string;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, label, description, id, ...props }, ref) => (
    <label
      htmlFor={id}
      className={cn(
        "relative flex cursor-pointer items-start gap-3 rounded-md border border-input bg-background p-4 shadow-sm transition-colors hover:bg-accent/40",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        "has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className,
      )}
    >
      <input
        ref={ref}
        id={id}
        type="radio"
        className="mt-0.5 size-4 shrink-0 accent-primary"
        {...props}
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium leading-none">{label}</span>
        {description ? (
          <span className="text-sm text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </label>
  ),
);
RadioGroupItem.displayName = "RadioGroupItem";
