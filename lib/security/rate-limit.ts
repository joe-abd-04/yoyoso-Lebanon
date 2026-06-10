// SERVER ONLY — server-side rate limiting + account lockout (Phase 9.8B).
//
// Backed by Postgres (migration 006) so limits hold across Vercel serverless
// instances, where in-memory counters would be useless. All calls go through
// the service-role client and SECURITY DEFINER RPCs.
//
// Fail-open policy: if the limiter store errors, we LOG and ALLOW the request.
// A transient DB hiccup must never lock every customer out of login/checkout.
// (Turnstile + the per-account lockout still apply as independent layers.)
//
// NEVER import this from a 'use client' module — it uses the service-role key.

import { createServerClient } from "@/lib/supabase/server";

export interface RateLimitRule {
  /** Max attempts allowed inside the window. */
  max: number;
  /** Rolling window length, in seconds. */
  windowSeconds: number;
}

// ── Tunable limits, centralised ─────────────────────────────────────────────
// Generous enough never to bother a real user; tight enough to stop flooding.
export const RL = {
  login: {
    ip: { max: 10, windowSeconds: 600 }, // 10 / 10 min per IP
    email: { max: 8, windowSeconds: 900 }, // 8 / 15 min per account
  },
  register: {
    ip: { max: 5, windowSeconds: 900 }, // 5 / 15 min per IP
  },
  forgot: {
    ip: { max: 5, windowSeconds: 900 }, // 5 / 15 min per IP
  },
  placeOrder: {
    burst: { max: 5, windowSeconds: 60 }, // 5 / min per IP
    sustained: { max: 25, windowSeconds: 600 }, // 25 / 10 min per IP
  },
  contact: {
    ip: { max: 3, windowSeconds: 600 }, // 3 / 10 min per IP
  },
} as const;

// Account lockout: 5 consecutive failures within 15 min → temporary lock that
// lifts 15 min after the most recent failure. Never permanent.
export const LOCKOUT = { threshold: 5, windowSeconds: 900 } as const;

/**
 * Returns true if the attempt is ALLOWED (and records it), false if over limit.
 * Fails open on any error.
 */
export async function checkRateLimit(
  bucket: string,
  rule: RateLimitRule,
): Promise<boolean> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.rpc("rate_limit_check", {
      p_bucket: bucket,
      p_max: rule.max,
      p_window_seconds: rule.windowSeconds,
    });
    if (error) {
      console.error("[rate-limit] rpc error:", error.message);
      return true; // fail open
    }
    return data !== false;
  } catch (err) {
    console.error("[rate-limit] unexpected error:", err);
    return true; // fail open
  }
}

export interface LockoutStatus {
  locked: boolean;
  retryAfterSeconds: number;
}

/** Current lockout status for an identifier (e.g. an email). Fails open. */
export async function checkAuthLockout(
  identifier: string,
): Promise<LockoutStatus> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.rpc("check_auth_lockout", {
      p_identifier: identifier,
      p_threshold: LOCKOUT.threshold,
      p_window_seconds: LOCKOUT.windowSeconds,
    });
    if (error || !data) {
      if (error) console.error("[lockout] rpc error:", error.message);
      return { locked: false, retryAfterSeconds: 0 };
    }
    return {
      locked: data.locked === true,
      retryAfterSeconds: data.retry_after_seconds ?? 0,
    };
  } catch (err) {
    console.error("[lockout] unexpected error:", err);
    return { locked: false, retryAfterSeconds: 0 };
  }
}

/** Record one failed login for an identifier. Best-effort (never throws). */
export async function recordAuthFailure(identifier: string): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.rpc("record_auth_failure", { p_identifier: identifier });
  } catch (err) {
    console.error("[lockout] recordAuthFailure error:", err);
  }
}

/** Clear failed logins for an identifier (on success). Best-effort. */
export async function clearAuthFailures(identifier: string): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.rpc("clear_auth_failures", { p_identifier: identifier });
  } catch (err) {
    console.error("[lockout] clearAuthFailures error:", err);
  }
}

/** Human-friendly "try again in N minutes/seconds" phrase. */
export function retryAfterText(seconds: number): string {
  if (seconds <= 0) return "a moment";
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const mins = Math.ceil(seconds / 60);
  return `${mins} minute${mins === 1 ? "" : "s"}`;
}

/** Normalise an email into a stable lockout/rate-limit identifier. */
export function emailKey(email: string): string {
  return email.trim().toLowerCase();
}
