import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Native <select> primitive. The shared shadcn kit (src/components/ui) has no
 * select, so this feature-local primitive mirrors the shared Input styling
 * (border, focus ring, disabled states) to stay visually consistent. Forwards its
 * ref so react-hook-form's register() can bind to it.
 */
const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = "Select";

export { Select };
