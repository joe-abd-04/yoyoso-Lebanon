/**
 * WhatsApp ordering helpers for YOYOSO.
 *
 * Orders are placed via WhatsApp to +961 76 520 447. These helpers build
 * pre-filled message text and open the WhatsApp chat in a new tab.
 */

import { siteConfig } from "@/data/config";
import { formatUSD } from "@/lib/formatPrice";
import type { Product } from "@/data/products";

/**
 * The international wa.me number (digits only).
 * - With no argument: derived from the static config (prepends Lebanon code 961).
 * - With an argument: the editable contact WhatsApp number from settings, which
 *   is already stored as full international digits (e.g. "96103133307") — we just
 *   strip any non-digits so a sloppily-entered value still produces a valid link.
 */
export function getWhatsAppNumber(override?: string): string {
  if (override) return override.replace(/\D/g, "");
  return "961" + siteConfig.contact.whatsappNumber.replace(/\D/g, "");
}

export interface CartLine {
  product: Pick<Product, "name" | "priceUSD" | "priceLBP" | "slug">;
  quantity: number;
  variant?: string;
}

/** Single-product enquiry message. */
export function buildWhatsAppProductMessage(
  product: Pick<Product, "name" | "priceUSD" | "priceLBP" | "slug">,
  options?: { variant?: string },
): string {
  const variant = options?.variant ? ` (${options.variant})` : "";
  return [
    `Hi! I'd like to order:`,
    `🛍️ ${product.name}${variant}`,
    `Price: ${formatUSD(product.priceUSD)}`,
    `Please confirm availability. Thank you!`,
  ].join("\n");
}

/** Full-cart order message with line items and totals. */
export function buildWhatsAppCartMessage(
  lines: CartLine[],
  totals?: { usd: number },
): string {
  const itemLines = lines.map((line) => {
    const variant = line.variant ? ` (${line.variant})` : "";
    const lineTotalUSD = line.product.priceUSD * line.quantity;
    return [
      `• ${line.product.name}${variant}`,
      `  Qty: ${line.quantity} — ${formatUSD(lineTotalUSD)}`,
    ].join("\n");
  });

  const totalLine = totals
    ? [``, `Total: ${formatUSD(totals.usd)}`]
    : [];

  return [
    `Hi ${siteConfig.name}! 👋`,
    ``,
    `I'd like to place this order:`,
    ``,
    ...itemLines,
    ...totalLine,
  ].join("\n");
}

/** Build the wa.me deep link for a given message (optionally to a specific number). */
export function buildWhatsAppUrl(message: string, number?: string): string {
  return `https://wa.me/${getWhatsAppNumber(number)}?text=${encodeURIComponent(
    message,
  )}`;
}

/** Open the WhatsApp chat in a new tab (no-op outside the browser). */
export function openWhatsApp(message: string): void {
  if (typeof window === "undefined") return;
  window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
}

// ── Support channel ───────────────────────────────────────────────────────────
// WhatsApp is now a SUPPORT/QUESTIONS channel only — not for placing orders.
// (buildWhatsAppProductMessage / buildWhatsAppCartMessage above remain for
//  reference but are no longer wired to any ordering button.)

export const SUPPORT_MESSAGE =
  "Hi! I have a question about YOYOSO products.";

/** wa.me deep link pre-filled with the support enquiry message. */
export function buildSupportWhatsAppUrl(number?: string): string {
  return buildWhatsAppUrl(SUPPORT_MESSAGE, number);
}
