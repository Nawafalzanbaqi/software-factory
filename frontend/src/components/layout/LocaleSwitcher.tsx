"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { locales, type Locale } from "@/lib/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const LABELS: Record<Locale, string> = { ar: "العربية", en: "English" };

/** Interactive leaf: switches locale while preserving the current pathname. */
export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSelect(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("language")}
          disabled={isPending}
          className="gap-2"
        >
          <Globe className="size-4" aria-hidden="true" />
          <span>{LABELS[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onSelect={() => onSelect(l)}
            aria-current={l === locale ? "true" : undefined}
            className={l === locale ? "font-semibold" : undefined}
          >
            {LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
