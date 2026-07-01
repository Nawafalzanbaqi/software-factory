import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder for the tracking view (used by Suspense/loading.tsx). */
export function OrderTrackingSkeleton({ steps = 4 }: { steps?: number }) {
  return (
    <div className="mx-auto max-w-2xl space-y-8" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-28 w-full rounded-lg" />
      <div className="space-y-6">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: steps }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="size-3 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
