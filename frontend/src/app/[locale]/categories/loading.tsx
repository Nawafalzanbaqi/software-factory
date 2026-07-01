import { Skeleton } from "@/components/ui/skeleton";
import { CategoriesGridSkeleton } from "@/features/categories";

export default function Loading() {
  return (
    <div className="container section-y space-y-6" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <CategoriesGridSkeleton />
    </div>
  );
}
