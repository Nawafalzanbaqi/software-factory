import { AppNav } from "@/components/app-nav";

/**
 * Shell for authenticated pages: renders the primary nav above the page. The
 * sign-in page lives outside this group so it has no nav. Route protection is
 * enforced in middleware (Auth.js `authorized` callback).
 */
export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className="container flex-1 py-10">{children}</main>
    </div>
  );
}
