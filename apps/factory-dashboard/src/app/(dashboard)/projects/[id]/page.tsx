import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  platformApi,
  type AnalyticsDto,
  type ProjectDetailDto,
  type UsageResponseDto,
} from "@/lib/platform-api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PhasePipeline } from "@/components/phase-pipeline";
import { ApprovalGates } from "@/components/approval-gates";
import { AnalyticsPanel } from "@/components/analytics-panel";
import { UsageTable } from "@/components/usage-table";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const detail = await platformApi.getProject(id);
    return { title: detail.project.name };
  } catch {
    return { title: "Project" };
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let detail: ProjectDetailDto;
  try {
    detail = await platformApi.getProject(id);
  } catch {
    notFound();
  }
  // The Platform API nests the project under `.project`; gates + recentDeployments
  // are top-level on the detail response.
  const p = detail.project;

  // Usage + analytics are non-critical: degrade to null on failure.
  const [usage, analytics] = await Promise.all([
    platformApi.getUsage(id).catch((): UsageResponseDto | null => null),
    platformApi.getAnalytics(id).catch((): AnalyticsDto | null => null),
  ]);

  const deployments = detail.recentDeployments ?? [];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All projects
        </Link>
      </div>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1>
          <Badge variant="secondary">{p.siteType}</Badge>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <div className="flex gap-1">
            <dt>Created</dt>
            <dd className="text-foreground">{formatDateTime(p.createdAt)}</dd>
          </div>
          {p.branch && (
            <div className="flex gap-1">
              <dt>Branch</dt>
              <dd className="font-mono text-foreground">{p.branch}</dd>
            </div>
          )}
          {p.repoUrl && (
            <div className="flex gap-1">
              <dt>Repo</dt>
              <dd>
                <a
                  href={p.repoUrl}
                  className="text-primary underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.repoUrl}
                </a>
              </dd>
            </div>
          )}
          {p.liveUrl && (
            <div className="flex gap-1">
              <dt>Live</dt>
              <dd>
                <a
                  href={p.liveUrl}
                  className="text-primary underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.liveUrl}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </header>

      {/* Visual 7-phase pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
          <CardDescription>
            Current phase:{" "}
            <span className="font-medium text-foreground">
              {p.currentPhase}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhasePipeline currentPhase={p.currentPhase} />
        </CardContent>
      </Card>

      {/* The 3 human approval gates with approve actions */}
      <ApprovalGates projectId={p.id} gates={detail.gates ?? []} />

      <div className="grid gap-8 lg:grid-cols-2">
        <UsageTable usage={usage} />
        <AnalyticsPanel analytics={analytics} />
      </div>

      {/* Recent deployment events (from CI webhook / manual) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent deployments</CardTitle>
          <CardDescription>
            Deployment events recorded for this project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deployments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No deployment events yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deployments.map((deployment) => (
                  <TableRow key={deployment.id}>
                    <TableCell>
                      <Badge
                        variant={
                          deployment.status === "Success"
                            ? "success"
                            : deployment.status === "Failure"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {deployment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="uppercase text-muted-foreground">
                      {deployment.source}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(deployment.occurredAt)}
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
