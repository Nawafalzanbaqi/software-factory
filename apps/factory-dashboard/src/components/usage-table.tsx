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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatUsd } from "@/lib/utils";
import type { UsageResponseDto } from "@/lib/platform-api";

/**
 * API cost table from GET /api/projects/{id}/usage. One row per usage record
 * (per model), with a footer total. If per-model aggregation is desired the
 * Platform API can return pre-aggregated rows; here we render what it sends.
 */
export function UsageTable({ usage }: { usage: UsageResponseDto | null }) {
  const records = usage?.records ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>API cost</CardTitle>
        <CardDescription>
          LLM token usage and spend recorded for this project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!usage ? (
          <p className="text-sm text-destructive" role="alert">
            Failed to load usage.
          </p>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No API usage recorded yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Cost (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-xs">{record.model}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(record.tokens)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUsd(record.costUsd)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(usage.totalTokens)}
                </TableCell>
                <TableCell
                  className="text-right tabular-nums"
                  data-testid="usage-total"
                >
                  {formatUsd(usage.totalCostUsd)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
