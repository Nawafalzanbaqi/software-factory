import { getTranslations } from "next-intl/server";
import type { CategoryDto } from "@/lib/api/types";
import { CategoryCard } from "./CategoryCard";

/** Responsive, mobile-first category grid (Server Component). */
export async function CategoryGrid({ categories }: { categories: CategoryDto[] }) {
  const t = await getTranslations("categories");

  if (categories.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => (
        <li key={category.id}>
          {/* CategoryCard is async — allowed as a child element. */}
          <CategoryCard category={category} />
        </li>
      ))}
    </ul>
  );
}
