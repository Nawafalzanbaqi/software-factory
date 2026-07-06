import { Skeleton } from "@/components/ui/skeleton";
import { ProductListingSkeleton } from "@/features/products";

export default function Loading() {
  return (
    <div className="container section-y space-y-6" aria-busy="true">
      {/* Mirrors the listing header: kicker + title + subtitle. No chip-row
          skeleton — chips are config/data-dependent and may render nothing. */}
      <div className="space-y-3">
        <Skeleton className="h-1 w-10 rounded-full" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      <ProductListingSkeleton />
    </div>
  );
}
