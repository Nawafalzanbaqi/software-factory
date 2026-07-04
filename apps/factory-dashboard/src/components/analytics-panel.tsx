import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import type { AnalyticsDto } from "@/lib/platform-api";

/**
 * Analytics metric panel. Reads GET /api/analytics/{id}, which is backed by
 * the NoOpAnalyticsProvider (mirrors the client backend's NoOp provider
 * pattern) — it returns zeros/empty and provider:"noop".
 *
 * // TODO(phase-4): real Umami / LiteLLM analytics.
 */
export function AnalyticsPanel({ analytics }: { analytics: AnalyticsDto | null }) {
  const isNoOp = !analytics || analytics.provider === "noop";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Analytics</CardTitle>
          <Badge variant="outline" className="font-mono">
            {analytics?.provider ? `provider: ${analytics.provider}` : "unavailable"}
          </Badge>
        </div>
        <CardDescription>
          {isNoOp
            ? "Placeholder metrics — real analytics arrive in a later phase."
            : "Live site metrics."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-4">
          <div className="rounded-md border border-border/70 bg-muted/30 p-4">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Visitors
            </dt>
            <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {formatNumber(analytics?.visitors ?? 0)}
            </dd>
          </div>
          <div className="rounded-md border border-border/70 bg-muted/30 p-4">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Page views
            </dt>
            <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {formatNumber(analytics?.pageViews ?? 0)}
            </dd>
          </div>
        </dl>
        {isNoOp && (
          <p className="text-xs text-muted-foreground">
            {/* TODO(phase-4): wire real Umami analytics via IAnalyticsProvider. */}
            Analytics are handled by the NoOp provider until Phase 4.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
