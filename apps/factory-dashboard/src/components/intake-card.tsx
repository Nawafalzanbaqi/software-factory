import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
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
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">Client</dt>
              <dd className="font-medium">
                {intake.clientName}{" "}
                <span className="text-muted-foreground">· {intake.clientContact}</span>
              </dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">Language &amp; direction</dt>
              <dd className="font-medium">
                {intake.language}{" "}
                <Badge variant="secondary">{intake.defaultDirection.toUpperCase()}</Badge>
              </dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">Design direction</dt>
              <dd className="font-medium">{intake.designDirection}</dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">Sections</dt>
              <dd className="flex flex-wrap gap-1">
                {intake.sections.map((key) => (
                  <Badge key={key} variant="secondary">
                    {key}
                  </Badge>
                ))}
              </dd>
            </div>
            {intake.payments.length > 0 && (
              <div className="space-y-0.5">
                <dt className="text-muted-foreground">Payments</dt>
                <dd className="font-medium">{intake.payments.join(", ")}</dd>
              </div>
            )}
            {intake.integrations.length > 0 && (
              <div className="space-y-0.5">
                <dt className="text-muted-foreground">Integrations</dt>
                <dd className="font-medium">{intake.integrations.join(", ")}</dd>
              </div>
            )}
            {intake.features.length > 0 && (
              <div className="space-y-0.5">
                <dt className="text-muted-foreground">Features</dt>
                <dd className="font-medium">{intake.features.join(", ")}</dd>
              </div>
            )}
            {intake.notes && (
              <div className="space-y-0.5 sm:col-span-2">
                <dt className="text-muted-foreground">Notes</dt>
                <dd>{intake.notes}</dd>
              </div>
            )}
          </dl>
        )}

        {optionsJson && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">options.json</h3>
              <CopyButton
                text={optionsJson}
                label="Copy options.json"
                testId="copy-options-json"
              />
            </div>
            <pre
              dir="ltr"
              data-testid="options-json"
              className="max-h-96 overflow-auto rounded-md border border-border bg-muted p-4 text-xs leading-relaxed"
            >
              {optionsJson}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
