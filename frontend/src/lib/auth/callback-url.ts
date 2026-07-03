/**
 * Open-redirect guard for the post-sign-in destination (security audit
 * fix #5). Only same-site relative paths survive; everything else resolves to
 * undefined (the caller falls back to /dashboard).
 *
 * The old prefix check ("/" but not "//") was structurally bypassable:
 * browsers treat backslashes in URLs as forward slashes, so "/\evil.com"
 * navigates to //evil.com. This version rejects backslashes outright and then
 * proves the value structurally — parsed against a fixed private base origin,
 * the result must still live on that origin (catches protocol-relative forms,
 * "/..//host" tricks and anything else the URL parser would send off-site).
 *
 * Dependency-free (no server-only) so both server pages and unit tests import it.
 */

/** Fictional base origin — never routable; used only to anchor relative parsing. */
const VALIDATION_BASE = "http://callback-url.invalid";

export function safeCallbackUrl(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  // Backslashes are path separators to browsers ("/\evil.com" ⇒ //evil.com).
  if (value.includes("\\")) return undefined;
  // Must be a rooted relative path; "//" is protocol-relative (off-site).
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;

  let url: URL;
  try {
    url = new URL(value, VALIDATION_BASE);
  } catch {
    return undefined;
  }
  // Anything that escaped the base origin (or smuggled credentials) is hostile.
  if (url.origin !== VALIDATION_BASE || url.username || url.password) {
    return undefined;
  }

  // Return the PARSED path — what the browser will actually navigate to —
  // rather than the raw input, so no unparsed residue survives validation.
  const result = url.pathname + url.search + url.hash;
  // Re-validate the OUTPUT: normalization can mint protocol-relative forms
  // the input checks never saw ("/..//host" parses to pathname "//host").
  if (!result.startsWith("/") || result.startsWith("//")) return undefined;
  return result;
}
