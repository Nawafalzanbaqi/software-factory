"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter } from "@/lib/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  /** Pre-fill value (e.g. the current ?q on the search page). */
  defaultQuery?: string;
  className?: string;
  /** Focus the input on mount (used on the dedicated search page, not the header). */
  autoFocus?: boolean;
}

/**
 * Interactive leaf: the store search box. Submitting navigates to
 * /search?q=<term> (locale-aware via next-intl router) so the results are
 * rendered by the Server Component page — no client-side data fetching here.
 *
 * Barrel-exported so the integrator can mount it in the Header, gated by
 * isFeatureEnabled('search').
 *
 * a11y: wrapped in role="search", the input carries a localized aria-label and
 * the submit button an explicit label with a leading icon.
 */
export function SearchBar({ defaultQuery = "", className, autoFocus }: SearchBarProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const [value, setValue] = useState(defaultQuery);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = value.trim();
    // TODO (backlog): debounced type-ahead suggestions + search analytics events.
    startTransition(() => {
      router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    });
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn("flex w-full items-center gap-2", className)}
    >
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          name="q"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("inputLabel")}
          autoFocus={autoFocus}
          enterKeyHint="search"
          className="ps-9"
        />
      </div>
      <Button type="submit" disabled={isPending} aria-label={t("submit")}>
        {t("submit")}
      </Button>
    </form>
  );
}
