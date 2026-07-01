import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Multiline text input. The shared shadcn kit (src/components/ui) has no textarea,
 * so this feature-local primitive mirrors the shared Input styling (border, focus
 * ring, disabled states) to stay visually consistent. Forwards its ref so
 * react-hook-form's register() can bind to it.
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
