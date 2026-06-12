"use server";

// SERVER ACTION — persist a contact-form submission (Phase 9.8B).
//
// Replaces the old localStorage-only stopgap. Security model:
//   • Honeypot field is re-checked server-side (defence in depth).
//   • zod re-validates every field (never trust the client).
//   • Per-IP rate limit stops form flooding on Vercel serverless.
//   • All text is sanitised (HTML stripped) before it touches the DB.
//   • Insert uses the service-role client; contact_messages is insert-only for
//     the public and readable only by service role (RLS, migration 001).

import { contactSchema } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitize";
import { createServerClient } from "@/lib/supabase/server";
import { getContactInfo } from "@/lib/data/settings";
import { sendContactEmails } from "@/lib/email/contact";
import { checkRateLimit, RL } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

export type ContactActionResult = { ok: true } | { ok: false; error: string };

export async function submitContactMessage(input: {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  /** Honeypot value — must be empty for a real submission. */
  hp?: string;
}): Promise<ContactActionResult> {
  // Honeypot tripped → pretend success, persist nothing (give bots no signal).
  if (input.hp && input.hp.trim() !== "") {
    return { ok: true };
  }

  const parsed = contactSchema.safeParse({
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    subject: input.subject,
    message: input.message,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }

  const ip = await getClientIp();
  const allowed = await checkRateLimit(
    `contact:ip:${ip ?? "unknown"}`,
    RL.contact.ip,
  );
  if (!allowed) {
    return {
      ok: false,
      error:
        "You're sending messages too quickly. Please wait a few minutes and try again.",
    };
  }

  const d = parsed.data;
  const clean = {
    name: sanitizeText(d.fullName),
    email: d.email,
    phone: sanitizeText(d.phone),
    subject: d.subject,
    message: sanitizeText(d.message),
  };

  const supabase = createServerClient();
  const { error } = await supabase.from("contact_messages").insert(clean);

  if (error) {
    console.error("[contact] insert error:", error.message);
    return {
      ok: false,
      error: "We couldn't send your message right now. Please try again.",
    };
  }

  // Notify the store (+ auto-reply the customer). Best-effort — a failed email
  // must never fail a submission that was already saved to the DB.
  try {
    const { email: storeEmail } = await getContactInfo();
    await sendContactEmails(clean, storeEmail);
  } catch (err) {
    console.error("[contact] notification email failed:", err);
  }

  return { ok: true };
}
