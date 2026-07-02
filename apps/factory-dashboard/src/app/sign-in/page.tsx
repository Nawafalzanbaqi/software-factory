import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { SignInForm } from "@/components/sign-in-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Factory } from "lucide-react";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // Already signed in → skip the form.
  const session = await auth();
  if (session?.user) redirect("/projects");

  const { callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm animate-fade-in">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary/10">
            <Factory className="size-6 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Factory Control Plane</CardTitle>
          <CardDescription>Admin sign-in</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm callbackUrl={callbackUrl ?? "/projects"} />
        </CardContent>
      </Card>
    </main>
  );
}
