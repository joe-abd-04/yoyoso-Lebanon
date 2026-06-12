// SERVER-ONLY. Contact-form emails (launch):
//   1. A notification to the store inbox so the owners are alerted, with the
//      sender set as reply-to (so they can reply directly from their mailbox).
//   2. A brief "we got your message" auto-reply to the customer.
// Both go through sendEmail(), which never throws; the contact action also wraps
// this in try/catch so a failed email never breaks the submission.

import { sendEmail, FROM_NOREPLY } from "@/lib/email/client";
import { emailLayout, esc, EMAIL_COLORS } from "@/lib/email/layout";

const { MUTED, BORDER, TEXT } = EMAIL_COLORS;

export interface ContactEmailInput {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

function notificationHtml(m: ContactEmailInput): string {
  const field = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};width:110px;vertical-align:top;">${esc(label)}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${TEXT};">${value}</td>
    </tr>`;

  const body = `
    <h1 style="margin:0 0 4px;font-size:20px;color:${TEXT};">New contact message</h1>
    <p style="margin:0 0 20px;color:${MUTED};font-size:14px;">Someone reached out through the website contact form.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${field("Name", esc(m.name))}
      ${field("Email", `<a href="mailto:${esc(m.email)}" style="color:${EMAIL_COLORS.BRAND_TEAL};">${esc(m.email)}</a>`)}
      ${field("Phone", esc(m.phone))}
      ${field("Subject", esc(m.subject))}
      ${field("Message", esc(m.message).replace(/\n/g, "<br />"))}
    </table>
    <p style="margin:20px 0 0;color:${MUTED};font-size:13px;">Reply to this email to respond directly to ${esc(m.name)}.</p>`;

  return emailLayout({
    title: `New contact message: ${m.subject}`,
    preheader: `From ${m.name} — ${m.subject}`,
    bodyHtml: body,
  });
}

function autoReplyHtml(m: ContactEmailInput): string {
  const body = `
    <h1 style="margin:0 0 4px;font-size:20px;color:${TEXT};">We've got your message!</h1>
    <p style="margin:0 0 16px;color:${MUTED};font-size:14px;line-height:1.6;">
      Hi ${esc(m.name)}, thanks for reaching out to YOYOSO Lebanon. Our team will get back to you
      within 24 hours. For anything urgent, message us on WhatsApp.
    </p>
    <div style="background:#f8fafc;border:1px solid ${BORDER};border-radius:10px;padding:14px 16px;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};margin-bottom:6px;">Your message</div>
      <div style="font-size:13px;color:${TEXT};line-height:1.6;">${esc(m.message).replace(/\n/g, "<br />")}</div>
    </div>`;

  return emailLayout({
    title: "We received your message — YOYOSO Lebanon",
    preheader: "Thanks for contacting YOYOSO Lebanon — we'll reply within 24 hours.",
    bodyHtml: body,
  });
}

/**
 * Send the store notification (+ customer auto-reply). Best-effort: returns
 * nothing and never throws. `storeEmail` is the admin-configurable contact
 * address (settings.contact.email).
 */
export async function sendContactEmails(
  m: ContactEmailInput,
  storeEmail: string,
): Promise<void> {
  // Notify the store, reply-to the sender.
  await sendEmail({
    from: FROM_NOREPLY,
    to: storeEmail,
    subject: `New contact message: ${m.subject}`,
    html: notificationHtml(m),
    replyTo: m.email,
  });

  // Friendly auto-reply to the customer (independent — a failure here is logged
  // by sendEmail and ignored).
  await sendEmail({
    from: FROM_NOREPLY,
    to: m.email,
    subject: "We received your message — YOYOSO Lebanon",
    html: autoReplyHtml(m),
  });
}
