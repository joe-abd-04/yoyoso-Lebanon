/**
 * Input sanitisation helpers.
 *
 * React already escapes any value rendered as text, so the app is not
 * vulnerable to stored XSS through normal JSX. These helpers are defence in
 * depth: we strip ALL HTML from user input *before* it is persisted
 * (localStorage today, a database in Phase 9) or echoed into non-React sinks
 * (e.g. a WhatsApp message URL). Never render user input as raw HTML.
 */

import DOMPurify from "dompurify";

/**
 * Return the input stripped of every HTML tag/attribute — i.e. safe plain text.
 * Falls back to a conservative regex strip when no DOM is available (SSR).
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  const value = input.trim();
  if (value === "") return "";

  if (typeof window === "undefined" || !DOMPurify.isSupported) {
    // No DOM (server / unsupported): drop tags and stray angle brackets.
    return value.replace(/<[^>]*>/g, "").replace(/[<>]/g, "");
  }

  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
}

/**
 * Sanitise every string field of a flat object, leaving non-strings untouched.
 * Useful for cleaning a whole form payload before it is stored/sent.
 */
export function sanitizeFields<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    out[key] = typeof val === "string" ? sanitizeText(val) : val;
  }
  return out as T;
}
