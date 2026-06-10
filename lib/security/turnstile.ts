// SERVER ONLY — Cloudflare Turnstile verification (Phase 9.8).
//
// The browser renders the Turnstile widget with NEXT_PUBLIC_TURNSTILE_SITE_KEY
// and receives a one-time token. That token MUST be verified here, server-side,
// against Cloudflare's siteverify endpoint using the secret key before any
// sensitive action (login / register / password reset) proceeds. The client is
// never trusted — a missing or invalid token is rejected.
//
// Fail-safe policy:
//   • Keys configured        → always verify; reject on any failure.
//   • Keys NOT configured:
//       – development         → skip verification (degrade gracefully so local
//                               dev keeps working without keys).
//       – production          → FAIL CLOSED (reject), so we never silently ship
//                               with CAPTCHA disabled.
//
// NEVER import this file from a 'use client' module — it reads TURNSTILE_SECRET_KEY.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const isProd = process.env.NODE_ENV === "production";

/** True when both the site key (client) and secret key (server) are present. */
export function isTurnstileConfigured(): boolean {
  return Boolean(SITE_KEY && SECRET_KEY);
}

export type TurnstileResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; error: string };

const GENERIC_FAIL =
  "Verification failed. Please complete the challenge and try again.";

/**
 * Verify a Turnstile token against Cloudflare. `remoteIp` is optional but
 * recommended (Cloudflare cross-checks it against the token).
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string | null,
): Promise<TurnstileResult> {
  // Not configured: degrade in dev, fail closed in prod.
  if (!isTurnstileConfigured()) {
    if (isProd) {
      console.error(
        "[turnstile] TURNSTILE keys are not set in production — failing closed.",
      );
      return { ok: false, error: GENERIC_FAIL };
    }
    return { ok: true, skipped: true };
  }

  if (!token || typeof token !== "string") {
    return { ok: false, error: "Please complete the verification challenge." };
  }

  const body = new URLSearchParams();
  body.set("secret", SECRET_KEY!);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      // Never cache a one-time verification.
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[turnstile] siteverify HTTP error:", res.status);
      return { ok: false, error: GENERIC_FAIL };
    }

    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (data.success) return { ok: true };

    // Log the Cloudflare error codes for diagnostics, but never leak them.
    console.warn("[turnstile] verification failed:", data["error-codes"]);
    return { ok: false, error: GENERIC_FAIL };
  } catch (err) {
    // Network error reaching Cloudflare — fail closed but with a retry message.
    console.error("[turnstile] siteverify request error:", err);
    return {
      ok: false,
      error: "Couldn't verify the challenge right now. Please try again.",
    };
  }
}
