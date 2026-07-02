import { getTranslations } from "next-intl/server";
import type { MenuItemDto } from "../types";
import { MenuItemCard } from "./MenuItemCard";

/** Responsive, mobile-first menu grid (Server Component). */
export async function MenuGrid({ items }: { items: MenuItemDto[] }) {
  const t = await getTranslations("menu");

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          {/* MenuItemCard is async — allowed as a child element. */}
          <MenuItemCard item={item} />
        </li>
      ))}
    </ul>
  );
}
