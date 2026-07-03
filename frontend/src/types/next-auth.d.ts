import type { DefaultSession } from "next-auth";
import type { DashboardRole } from "@/lib/auth/roles";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string; role?: DashboardRole };
    /** Payload CMS JWT for authed Payload REST calls from the dashboard. */
    payloadToken?: string;
  }
  interface User {
    role?: DashboardRole;
    payloadToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: DashboardRole;
    payloadToken?: string;
  }
}
