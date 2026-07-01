import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder for the promo banners section (Suspense fallback). */
export function PromoBannersSkeleton() {
  return (
    <div className="container section-y" aria-hidden="true">
      <Skeleton className="mb-6 h-8 w-40" />
      <Skeleton className="aspect-[3/2] w-full rounded-2xl sm:aspect-[21/9]" />
    </div>
  );
}
