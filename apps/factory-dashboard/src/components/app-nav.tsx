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
 * to show the signed-in admin email (in mono — it's an identifier).
 */
export async function AppNav() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <nav
        aria-label="Primary"
        className="container flex h-14 items-center justify-between gap-4"
      >
        <div className="flex items-center gap-6">
          <Link
            href="/projects"
            className="flex items-center gap-2.5 rounded-md font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="flex size-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 shadow-glow-primary-sm">
              <Factory className="size-4 text-primary" aria-hidden="true" />
            </span>
            <span>Factory Control Plane</span>
          </Link>
          <ul className="flex items-center gap-1 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-3">
          {session?.user?.email && (
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
              {session.user.email}
            </span>
          )}
          <SignOutButton />
        </div>
      </nav>
    </header>
  );
}
