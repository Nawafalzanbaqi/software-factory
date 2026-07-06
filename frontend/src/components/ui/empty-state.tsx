import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared empty-state panel: dashed border, gold icon chip, message, optional
 * action. Plain presentational markup — safe in both Server and Client
 * Components. Pass the icon already sized (e.g. <Heart className="size-6" />);
 * it is decorative, so it is hidden from assistive tech here.
 */
export function EmptyState({
  icon,
  message,
  action,
  className,
}: {
  icon: ReactNode;
  message: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-16 text-center",
        className,
      )}
    >
      <span aria-hidden="true" className="icon-chip size-12">
        {icon}
      </span>
      <p className="text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
