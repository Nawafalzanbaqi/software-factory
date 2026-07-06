import { Skeleton } from "@/components/ui/skeleton";

/** Route-level loading UI (streamed while a segment resolves). */
export default function Loading() {
  return (
    <div className="container section-y space-y-8" aria-busy="true" aria-live="polite">
      <div className="space-y-4">
        <Skeleton className="h-1 w-10 rounded-full" />
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
