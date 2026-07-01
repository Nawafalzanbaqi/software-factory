/**
 * Server component that injects a JSON-LD block. Data is trusted (built by our own
 * builders), but we escape "<" to avoid any script-break edge case.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
