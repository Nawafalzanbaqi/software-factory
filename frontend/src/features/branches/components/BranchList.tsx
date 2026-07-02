import type { Locale } from "@/lib/i18n/routing";
import type { BranchDto } from "../types";
import { BranchCard } from "./BranchCard";

/** Responsive grid of server-rendered branch cards. */
export function BranchList({
  branches,
  locale,
}: {
  branches: BranchDto[];
  locale: Locale;
}) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {branches.map((branch) => (
        <li key={branch.id} className="h-full">
          {/* Async Server Component rendered as JSX (streamed). */}
          <BranchCard branch={branch} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
