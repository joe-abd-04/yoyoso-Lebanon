// SERVER ONLY — request metadata helpers (Phase 9.8).
//
// On Vercel the client IP arrives in `x-forwarded-for` (a comma-separated list
// where the first entry is the originating client) or `x-real-ip`. These are
// set by the platform's edge and can't be spoofed past it for our purposes
// (good enough for rate-limit / abuse keys, not for authz).

import { headers } from "next/headers";

/** Best-effort client IP for the current request, or null if unknown. */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") ?? null;
}
