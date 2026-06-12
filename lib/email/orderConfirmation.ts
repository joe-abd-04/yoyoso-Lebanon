// SERVER-ONLY. Order confirmation email — sends a branded receipt to the
// customer after a successful order, via Resend.
//
// Does NOT use Supabase's built-in mailer (that is rate-limited and for auth
// emails only). The placeOrder action awaits this inside a try/catch, and
// sendEmail() itself never throws, so a failing email can never fail the order.

import type { StoredOrder } from "@/components/cart/cart-utils";
import { formatUSD } from "@/lib/formatPrice";
import { sendEmail, FROM_ORDERS } from "@/lib/email/client";
import { emailLayout, esc, formatEmailDate, EMAIL_COLORS } from "@/lib/email/layout";

const { MUTED, BORDER, TEXT } = EMAIL_COLORS;

function itemRows(order: StoredOrder): string {
  return order.items
    .map((i) => {
      const lineTotal = i.priceUSD * i.quantity;
      const meta = [
        i.variant ? esc(i.variant) : "",
        i.sku ? `SKU: ${esc(i.sku)}` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};vertical-align:top;">
          <div style="font-weight:600;color:${TEXT};">${esc(i.name)}</div>
          ${meta ? `<div style="font-size:12px;color:${MUTED};margin-top:2px;">${meta}</div>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};text-align:center;color:${MUTED};white-space:nowrap;">×${i.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};text-align:right;color:${MUTED};white-space:nowrap;">${formatUSD(i.priceUSD)}</td>
        <td style="padding:12px 0 12px 16px;border-bottom:1px solid ${BORDER};text-align:right;font-weight:600;white-space:nowrap;">${formatUSD(lineTotal)}</td>
      </tr>`;
    })
    .join("");
}

function totalsRows(order: StoredOrder): string {
  const t = order.totals;
  const row = (label: string, value: string, opts?: { bold?: boolean; teal?: boolean }) => `
      <tr>
        <td style="padding:4px 0;color:${opts?.bold ? TEXT : MUTED};font-weight:${opts?.bold ? 700 : 400};font-size:${opts?.bold ? 16 : 14}px;">${esc(label)}</td>
        <td style="padding:4px 0;text-align:right;font-weight:${opts?.bold ? 700 : 400};font-size:${opts?.bold ? 16 : 14}px;color:${opts?.teal ? EMAIL_COLORS.BRAND_TEAL : TEXT};white-space:nowrap;">${value}</td>
      </tr>`;

  return [
    row("Subtotal", formatUSD(t.subtotalUSD)),
    t.discountUSD > 0 ? row("Discount", `−${formatUSD(t.discountUSD)}`) : "",
    row("Delivery", t.freeDelivery ? "Free" : formatUSD(t.deliveryFeeUSD)),
    row("Total", formatUSD(t.totalUSD), { bold: true, teal: true }),
  ].join("");
}

function addressBlock(order: StoredOrder): string {
  const a = order.address;
  const lines = [a.line1, a.line2, a.city, a.region].filter(Boolean).map(esc);
  return `
    <div style="font-size:14px;line-height:1.6;color:${TEXT};">
      ${esc(order.customer.firstName)} ${esc(order.customer.lastName)}<br />
      ${lines.join("<br />")}<br />
      ${esc(order.customer.phone)}
      ${a.notes ? `<div style="font-size:12px;color:${MUTED};margin-top:6px;">Notes: ${esc(a.notes)}</div>` : ""}
    </div>`;
}

export function renderOrderConfirmationHtml(order: StoredOrder): string {
  const body = `
    <h1 style="margin:0 0 4px;font-size:22px;color:${TEXT};">Thank you for your order!</h1>
    <p style="margin:0 0 20px;color:${MUTED};font-size:14px;">
      Hi ${esc(order.customer.firstName)}, we've received your order and we're getting it ready.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8fafc;border:1px solid ${BORDER};border-radius:10px;padding:14px 16px;margin-bottom:24px;">
      <tr>
        <td style="font-size:13px;color:${MUTED};">Order number</td>
        <td style="font-size:13px;color:${MUTED};text-align:right;">Date</td>
      </tr>
      <tr>
        <td style="font-size:16px;font-weight:700;color:${EMAIL_COLORS.BRAND_TEAL};">${esc(order.orderNumber)}</td>
        <td style="font-size:14px;font-weight:600;text-align:right;">${formatEmailDate(order.createdAt)}</td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};padding-bottom:4px;">Item</td>
        <td style="font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};text-align:center;padding-bottom:4px;">Qty</td>
        <td style="font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};text-align:right;padding-bottom:4px;">Unit</td>
        <td style="font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};text-align:right;padding:0 0 4px 16px;">Total</td>
      </tr>
      ${itemRows(order)}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 28px;">
      ${totalsRows(order)}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="50%" style="vertical-align:top;padding-right:12px;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};margin-bottom:6px;">Delivery to</div>
          ${addressBlock(order)}
        </td>
        <td width="50%" style="vertical-align:top;padding-left:12px;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:${MUTED};margin-bottom:6px;">Payment</div>
          <div style="font-size:14px;color:${TEXT};">${esc(order.paymentMethod)}</div>
          <div style="font-size:12px;color:${MUTED};margin-top:4px;">Pay in cash when your order arrives.</div>
        </td>
      </tr>
    </table>

    <p style="margin:28px 0 0;color:${MUTED};font-size:13px;line-height:1.6;">
      We'll be in touch to arrange delivery. Questions? Just reply to this email or message us on WhatsApp.
      <br />Thank you for shopping with YOYOSO Lebanon! 💚
    </p>`;

  return emailLayout({
    title: `Your YOYOSO order ${order.orderNumber}`,
    preheader: `Order ${order.orderNumber} confirmed — total ${formatUSD(order.totals.totalUSD)}.`,
    bodyHtml: body,
  });
}

export async function sendOrderConfirmationEmail(
  order: StoredOrder,
): Promise<void> {
  await sendEmail({
    from: FROM_ORDERS,
    to: order.customer.email,
    subject: `Your YOYOSO order ${order.orderNumber} ✔`,
    html: renderOrderConfirmationHtml(order),
  });
}
