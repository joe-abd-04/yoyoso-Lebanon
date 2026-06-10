// SERVER-ONLY. Order confirmation email — integration point.
//
// This is structured so a real confirmation email CAN be sent on a successful
// order, but it deliberately does NOT use Supabase's built-in mailer (that is
// rate-limited and intended for auth emails only).
//
// Today this is a safe no-op that only logs in development. Wiring a real
// provider at launch should require nothing more than filling in the TODO below
// — every caller (the placeOrder action) already awaits this function inside a
// try/catch, so a failing email can never fail the order.

import type { StoredOrder } from "@/components/cart/cart-utils";

export async function sendOrderConfirmationEmail(
  order: StoredOrder,
): Promise<void> {
  // TODO: send real order confirmation email via Resend at launch
  // (needs a verified domain + email service, e.g. RESEND_API_KEY).
  //
  //   import { Resend } from "resend";
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({
  //     from: "YOYOSO <orders@yoyoso-lebanon.com>",
  //     to: order.customer.email,
  //     subject: `Your YOYOSO order ${order.orderNumber}`,
  //     html: renderOrderConfirmationHtml(order),
  //   });
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[email] (stub) order confirmation for ${order.orderNumber} → ${order.customer.email}`,
    );
  }
}
