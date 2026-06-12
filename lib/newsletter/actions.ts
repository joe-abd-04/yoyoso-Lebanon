"use server";

// SERVER ACTION — newsletter subscription.
//
// Replaces the old client-only stub. Security model (mirrors the contact form):
//   • Honeypot re-checked server-side.
//   • zod-validated email (never trust the client).
//   • Per-IP rate limit (reuses lib/security/rate-limit.ts).
//   • Insert via the service-role client. newsletter_subscribers is insert-only
//     for the public (RLS, migration 001); the unique(email) constraint makes a
//     duplicate signup a graceful no-op, not an error.
// No email is sent yet — we just persist the subscriber.

import { newsletterSchema } from "@/lib/validation";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, RL, emailKey } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

export type NewsletterResult =
  | { ok: true; already?: boolean }
  | { ok: false; error: string };

export async function subscribeToNewsletter(input: {
  email: string;
  /** Honeypot value — must be empty for a real submission. */
  hp?: string;
}): Promise<NewsletterResult> {
  // Honeypot tripped → pretend success, persist nothing.
  if (input.hp && input.hp.trim() !== "") {
    return { ok: true };
  }

  const parsed = newsletterSchema.safeParse({ email: input.email });
  if (!parsed.success) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const ip = await getClientIp();
  const allowed = await checkRateLimit(
    `newsletter:ip:${ip ?? "unknown"}`,
    RL.newsletter.ip,
  );
  if (!allowed) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const email = emailKey(parsed.data.email);
  const supabase = createServerClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email });

  if (error) {
    // 23505 = unique_violation → already subscribed (treat as success).
    if (error.code === "23505") {
      return { ok: true, already: true };
    }
    console.error("[newsletter] insert error:", error.message);
    return {
      ok: false,
      error: "We couldn't subscribe you right now. Please try again.",
    };
  }

  return { ok: true };
}
