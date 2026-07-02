import type { Metadata } from "next";
import Link from "next/link";
import { platformApi, type ClientDto, type ProjectDto } from "@/lib/platform-api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PhaseBadge } from "@/components/phase-badge";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Projects" };

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  let projects: ProjectDto[] = [];
  let clients: ClientDto[] = [];
  let loadError = false;
  try {
    [projects, clients] = await Promise.all([
      platformApi.listProjects(),
      platformApi.listClients(),
    ]);
  } catch {
    loadError = true;
  }

  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Each project moves through the 7-phase factory pipeline.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All projects</CardTitle>
          <CardDescription>
            {loadError
              ? "Could not reach the Platform API."
              : `${projects.length} project${projects.length === 1 ? "" : "s"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p className="text-sm text-destructive" role="alert">
              Failed to load projects. Check that the Platform API is running.
            </p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Site type</TableHead>
                  <TableHead>Current phase</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {clientName.get(project.clientId) ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.siteType}
                    </TableCell>
                    <TableCell>
                      <PhaseBadge phase={project.currentPhase} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(project.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
