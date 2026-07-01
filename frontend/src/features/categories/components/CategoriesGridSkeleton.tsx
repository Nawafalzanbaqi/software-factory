import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder for the category grid (used by Suspense/loading.tsx). */
export function CategoriesGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="space-y-3">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3" />
        </li>
      ))}
    </ul>
  );
}
