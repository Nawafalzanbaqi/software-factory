"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * App-wide toast host. Mounted once in the root layout. Interactive leaves call
 * `toast(...)` (re-exported) to surface feedback (e.g. add-to-cart success).
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-md border bg-background text-foreground shadow-premium",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}

export { toast };
