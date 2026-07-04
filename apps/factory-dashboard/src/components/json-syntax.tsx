import type { ReactNode } from "react";

/*
 * Minimal server-side JSON syntax tinting for read-only code panels (the
 * generated options.json). Wraps tokens in colored spans without altering the
 * text content in any way, so copy/paste and text assertions see the exact
 * source. No dependency, no client JS — a single regex pass.
 *
 * Tint mapping (all AA on the dark surface): keys → cyan (the panel's data
 * highlight), strings → soft foreground, numbers → violet, literals → amber.
 */

const TOKEN =
  /("(?:[^"\\]|\\.)*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

export function JsonSyntax({ json }: { json: string }) {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const match of json.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      nodes.push(json.slice(cursor, index));
    }

    const [full, str, colon] = match;
    if (str !== undefined) {
      if (colon !== undefined) {
        // Property key (plus the colon that follows it).
        nodes.push(
          <span key={key++} className="text-primary/80">
            {str}
          </span>,
          colon,
        );
      } else {
        nodes.push(
          <span key={key++} className="text-foreground/90">
            {str}
          </span>,
        );
      }
    } else if (full === "true" || full === "false" || full === "null") {
      nodes.push(
        <span key={key++} className="text-warning">
          {full}
        </span>,
      );
    } else {
      nodes.push(
        <span key={key++} className="text-accent">
          {full}
        </span>,
      );
    }
    cursor = index + full.length;
  }
  if (cursor < json.length) {
    nodes.push(json.slice(cursor));
  }

  return <span className="text-muted-foreground">{nodes}</span>;
}
