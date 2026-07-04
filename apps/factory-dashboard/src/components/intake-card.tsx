import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { JsonSyntax } from "@/components/json-syntax";
import type { ProjectIntakeDto } from "@/lib/platform-api";

/**
 * Intake summary + the generated options.json build manifest (read-only,
 * copyable) so the operator can hand it straight to the factory build.
 * Rendered only for projects registered through the New Project flow.
 */
export function IntakeCard({
  intake,
  optionsJson,
}: {
  intake?: ProjectIntakeDto | null;
  optionsJson?: string | null;
}) {
  if (!intake && !optionsJson) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intake &amp; build manifest</CardTitle>
        <CardDescription>
          Captured at registration; options.json is what the factory build
          consumes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {intake && (
          <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Client
              </dt>
              <dd className="font-medium">
                {intake.clientName}{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  · {intake.clientContact}
                </span>
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Language &amp; direction
              </dt>
              <dd className="font-medium">
                {intake.language}{" "}
                <Badge variant="secondary" className="font-mono">
                  {intake.defaultDirection.toUpperCase()}
                </Badge>
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Design direction
              </dt>
              <dd className="font-medium">{intake.designDirection}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Sections
              </dt>
              <dd className="flex flex-wrap gap-1">
                {intake.sections.map((key) => (
                  <Badge key={key} variant="secondary" className="font-mono">
                    {key}
                  </Badge>
                ))}
              </dd>
            </div>
            {intake.payments.length > 0 && (
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Payments
                </dt>
                <dd className="font-mono text-xs font-medium">
                  {intake.payments.join(", ")}
                </dd>
              </div>
            )}
            {intake.integrations.length > 0 && (
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Integrations
                </dt>
                <dd className="font-mono text-xs font-medium">
                  {intake.integrations.join(", ")}
                </dd>
              </div>
            )}
            {intake.features.length > 0 && (
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Features
                </dt>
                <dd className="font-mono text-xs font-medium">
                  {intake.features.join(", ")}
                </dd>
              </div>
            )}
            {intake.notes && (
              <div className="space-y-1 sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Notes
                </dt>
                <dd>{intake.notes}</dd>
              </div>
            )}
          </dl>
        )}

        {optionsJson && (
          <div className="overflow-hidden rounded-md border border-border">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-1.5">
              <h3 className="font-mono text-xs font-medium text-muted-foreground">
                options.json
              </h3>
              <CopyButton
                text={optionsJson}
                label="Copy options.json"
                testId="copy-options-json"
              />
            </div>
            <pre
              dir="ltr"
              data-testid="options-json"
              className="max-h-96 overflow-auto bg-background/60 p-4 font-mono text-xs leading-relaxed"
            >
              <JsonSyntax json={optionsJson} />
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
