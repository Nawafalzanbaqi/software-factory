import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder for the wishlist grid (Suspense fallback). */
export function WishlistSkeleton() {
  return (
    <ul
      aria-hidden="true"
      className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </li>
      ))}
    </ul>
  );
}
