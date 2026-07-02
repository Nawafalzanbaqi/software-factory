import { redirect } from "next/navigation";

/**
 * Root: authenticated admins go straight to the projects overview. Middleware
 * already redirects unauthenticated requests to /sign-in before this renders.
 */
export default function HomePage() {
  redirect("/projects");
}
