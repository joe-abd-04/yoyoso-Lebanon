// SERVER ONLY — Resend email client (launch).
//
// NEVER import this from a 'use client' module: RESEND_API_KEY is a server-only
// secret. All sends go through sendEmail(), which fails gracefully — if the key
// is missing (e.g. a preview env without it) or Resend errors, it LOGS and
// returns { ok: false } instead of throwing, so a failed email can never break
// the order/contact flow that called it.
//
// Emails MUST come from the Resend-verified domain (yoyoso-lb.com); Resend
// rejects any other From address.

import { Resend } from "resend";

// From-addresses on the verified domain.
export const FROM_ORDERS = "YOYOSO Lebanon <orders@yoyoso-lb.com>";
export const FROM_NOREPLY = "YOYOSO Lebanon <noreply@yoyoso-lb.com>";

let cached: Resend | null = null;

/** The Resend client, or null when RESEND_API_KEY is unset. */
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

export interface SendEmailArgs {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  /** Optional reply-to (e.g. the customer's address on a contact notification). */
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email via Resend. Never throws — returns { ok:false } on any problem
 * so callers can wrap the result without try/catch around their own logic.
 */
export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email] (skipped — no RESEND_API_KEY) → ${args.to}: ${args.subject}`);
    } else {
      console.error("[email] RESEND_API_KEY is not set in production.");
    }
    return { ok: false, error: "email_not_configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: args.from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      ...(args.replyTo ? { replyTo: args.replyTo } : {}),
    });
    if (error) {
      console.error("[email] Resend error:", error.name, error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("[email] unexpected send error:", err);
    return { ok: false, error: "send_failed" };
  }
}
