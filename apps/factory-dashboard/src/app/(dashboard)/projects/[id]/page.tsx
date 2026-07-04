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
import { IntakeCard } from "@/components/intake-card";
import { UsageTable } from "@/components/usage-table";
import { formatDateTime } from "@/lib/utils";
import { PHASE_LABELS, STATUS_LABELS } from "@/lib/phases";
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

const DEPLOYMENT_BADGE = {
  success: "success",
  failure: "destructive",
  pending: "warning",
} as const;

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
    <div className="space-y-10">
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          All projects
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1>
          <Badge variant="secondary" className="font-mono">
            {p.siteType}
          </Badge>
        </div>
        {/* Console readout: identifiers and links in mono key/value pairs. */}
        <dl className="flex flex-wrap gap-x-6 gap-y-1.5 font-mono text-xs text-muted-foreground">
          <div className="flex gap-1.5">
            <dt className="uppercase tracking-wider">id</dt>
            <dd className="text-foreground/80">{p.id}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="uppercase tracking-wider">created</dt>
            <dd className="text-foreground/80">{formatDateTime(p.createdAt)}</dd>
          </div>
          {p.branch && (
            <div className="flex gap-1.5">
              <dt className="uppercase tracking-wider">branch</dt>
              <dd className="text-foreground/80">{p.branch}</dd>
            </div>
          )}
          {p.repoUrl && (
            <div className="flex gap-1.5">
              <dt className="uppercase tracking-wider">repo</dt>
              <dd>
                <a
                  href={p.repoUrl}
                  className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.repoUrl}
                </a>
              </dd>
            </div>
          )}
          {p.liveUrl && (
            <div className="flex gap-1.5">
              <dt className="uppercase tracking-wider">live</dt>
              <dd>
                <a
                  href={p.liveUrl}
                  className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      {/* Visual 7-phase pipeline — the control room's centerpiece */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
          <CardDescription>
            Current phase:{" "}
            <span className="font-mono text-foreground">
              {PHASE_LABELS[p.currentPhase] ?? p.currentPhase}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 pt-2">
          <PhasePipeline currentPhase={p.currentPhase} />
        </CardContent>
      </Card>

      {/* The 3 human approval gates with approve actions */}
      <ApprovalGates projectId={p.id} gates={detail.gates ?? []} />

      {/* Intake spec + generated options.json (projects registered via New Project) */}
      <IntakeCard intake={detail.intake} optionsJson={detail.optionsJson} />

      <div className="grid gap-6 lg:grid-cols-2">
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
                          DEPLOYMENT_BADGE[deployment.status] ?? "secondary"
                        }
                      >
                        {STATUS_LABELS[deployment.status] ?? deployment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs uppercase text-muted-foreground">
                      {deployment.source}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
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
