/**
 * Public origin for shareable links.
 *
 * Uses the deployment's configured origin when it exists (so a copied link
 * never depends on where the copier is browsing from — previews, custom
 * domains), and falls back to the current origin in the browser.
 */
export function appOrigin(configured?: string | null): string {
  const value = (configured ?? process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (value) return value.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "";
}

/**
 * The canonical public URL for a course. Uses the course slug, which is the
 * stable identifier the catalogue and API already resolve by.
 */
export function courseShareUrl(slug: string, origin?: string | null): string {
  const base = appOrigin(origin);
  const path = `/courses/${encodeURIComponent(slug.trim())}`;
  return `${base}${path}`;
}
