import { signOut } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

/**
 * Server component with an inline server action form — no client JS needed to
 * end the session. Auth.js `signOut` clears the JWT cookie and redirects.
 */
export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/sign-in" });
      }}
    >
      <Button type="submit" variant="ghost" size="sm">
        <LogOut aria-hidden="true" />
        Sign out
      </Button>
    </form>
  );
}
