import type { Metadata } from "next";
import Link from "next/link";
import { platformApi, type IntakeCatalogDto } from "@/lib/platform-api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { NewProjectForm } from "./new-project-form";

export const metadata: Metadata = { title: "New Project" };

export const dynamic = "force-dynamic";

/**
 * Guided intake: registers a real client project via the platform. The form's
 * choices (site types, per-siteType sections, payments, integrations,
 * features) all come from GET /api/intake/catalog — nothing is hardcoded here.
 */
export default async function NewProjectPage() {
  let catalog: IntakeCatalogDto | null = null;
  try {
    catalog = await platformApi.getIntakeCatalog();
  } catch {
    // Rendered as an error card below.
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          All projects
        </Link>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">New Project</h1>
        <p className="text-sm text-muted-foreground">
          Capture the client intake. The platform validates it, registers the
          project in the 7-phase pipeline and generates its options.json build
          manifest.
        </p>
      </header>

      {catalog ? (
        <NewProjectForm catalog={catalog} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Intake unavailable</CardTitle>
            <CardDescription>Could not reach the Platform API.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive" role="alert">
              Failed to load the intake catalog. Check that the Platform API is
              running, then reload this page.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
