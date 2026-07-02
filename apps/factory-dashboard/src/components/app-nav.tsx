import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { SignOutButton } from "@/components/sign-out-button";
import { Factory } from "lucide-react";

const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/clients", label: "Clients" },
];

/**
 * Top navigation for authenticated pages. Server component: reads the session
 * to show the signed-in admin email.
 */
export async function AppNav() {
  const session = await auth();

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur">
      <nav
        aria-label="Primary"
        className="container flex h-14 items-center justify-between gap-4"
      >
        <div className="flex items-center gap-6">
          <Link
            href="/projects"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <Factory className="size-5 text-primary" aria-hidden="true" />
            <span>Factory Control Plane</span>
          </Link>
          <ul className="flex items-center gap-1 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-3">
          {session?.user?.email && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.email}
            </span>
          )}
          <SignOutButton />
        </div>
      </nav>
    </header>
  );
}
