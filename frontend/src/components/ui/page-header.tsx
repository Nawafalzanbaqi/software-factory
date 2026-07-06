import { cn } from "@/lib/utils";

/**
 * Shared page header: gold kicker rule + display h1 + optional subtitle.
 * One definition of the page-level type scale so pages and their loading
 * skeletons stay in sync (skeletons mirror: h-1 w-10 kicker, h-9 title row).
 */
export function PageHeader({
  title,
  subtitle,
  headingId,
  className,
}: {
  title: string;
  subtitle?: string;
  headingId?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-xl", className)}>
      <div aria-hidden="true" className="kicker mb-4" />
      <h1 id={headingId} className="font-display text-3xl font-semibold sm:text-4xl">
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
