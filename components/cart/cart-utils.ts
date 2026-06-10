/**
 * Cart/checkout helpers: totals, promo codes, the spec WhatsApp messages, and
 * the order handed to the confirmation page. Framework-free + side-effect-free
 * except the explicit sessionStorage accessors.
 */

import type { CartItem } from "@/store/cartStore";
import { formatUSD } from "@/lib/formatPrice";
import { siteConfig } from "@/data/config";
import type { PromoConfig, PromoType } from "@/lib/settings/shared";

/**
 * Free-delivery threshold in USD. The spec (and the site-wide AnnouncementBar)
 * uses $30; note this differs from the placeholder `config.freeDeliveryThreshold`.
 */
export const FREE_DELIVERY_THRESHOLD_USD = 30;

// ── Promo codes ───────────────────────────────────────────────────────────────
// The single active promo code is configured in the admin panel and stored in
// the `settings` table. Client components receive it via <SettingsProvider> and
// validate entered codes against it; placeOrder re-validates server-side so the
// discount can never be faked.

export interface AppliedPromo {
  code: string;
  type: PromoType;
  /** Percent (0–100) for 'percent', flat USD amount for 'fixed'. */
  value: number;
}

/**
 * Validate an entered code against the active promo config (case-insensitive).
 * Returns the applied promo when it matches an enabled, valid code, else null.
 */
export function validatePromo(
  code: string | null | undefined,
  active: PromoConfig | null | undefined,
): AppliedPromo | null {
  if (!code || !active || !active.enabled) return null;
  if (!active.code || !(active.value > 0)) return null;
  if (code.trim().toUpperCase() !== active.code.trim().toUpperCase()) {
    return null;
  }
  return {
    code: active.code.trim().toUpperCase(),
    type: active.type,
    value: active.value,
  };
}

/** Discount in USD for an applied promo, clamped to [0, subtotal]. */
export function promoDiscountUSD(
  subtotalUSD: number,
  promo: AppliedPromo | null,
): number {
  if (!promo || subtotalUSD <= 0) return 0;
  const raw =
    promo.type === "percent" ? subtotalUSD * (promo.value / 100) : promo.value;
  return Math.max(0, Math.min(raw, subtotalUSD));
}

/** Human label for an applied promo's discount, e.g. "20% off" or "$5.00 off". */
export function promoDiscountLabel(promo: AppliedPromo): string {
  return promo.type === "percent"
    ? `${Math.round(promo.value)}% off`
    : `${formatUSD(promo.value)} off`;
}

const PROMO_KEY = "yys-promo";

export function getStoredPromo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(PROMO_KEY);
  } catch {
    return null;
  }
}

export function setStoredPromo(code: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (code) sessionStorage.setItem(PROMO_KEY, code);
    else sessionStorage.removeItem(PROMO_KEY);
  } catch {
    // ignore
  }
}

// ── Totals ────────────────────────────────────────────────────────────────────

export interface CartTotals {
  subtotalUSD: number;
  subtotalLBP: number;
  discountUSD: number;
  discountLBP: number;
  /** Delivery charge applied to this order (0 when free delivery threshold is met). */
  deliveryFeeUSD: number;
  totalUSD: number;
  totalLBP: number;
  freeDelivery: boolean;
}

export function computeCartTotals(
  items: CartItem[],
  /**
   * The applied promo (from validatePromo against the active settings promo), or
   * null for no discount. The discount amount is derived here so percent AND
   * fixed-USD promos are handled in one place.
   */
  promo: AppliedPromo | null = null,
  /**
   * Delivery fee in USD. Comes from the editable `settings` table via
   * getDeliveryFee() (provided to the client by <SettingsProvider>). Defaults
   * to the static config value so server/legacy callers still work safely.
   */
  deliveryFee: number = siteConfig.deliveryFee,
): CartTotals {
  const subtotalUSD = items.reduce((s, i) => s + i.priceUSD * i.quantity, 0);
  const subtotalLBP = items.reduce((s, i) => s + i.priceLBP * i.quantity, 0);
  const discountUSD = promoDiscountUSD(subtotalUSD, promo);
  // Mirror the USD discount proportionally onto the (vestigial) LBP subtotal.
  const discountFraction = subtotalUSD > 0 ? discountUSD / subtotalUSD : 0;
  const discountLBP = subtotalLBP * discountFraction;
  const freeDelivery = subtotalUSD >= FREE_DELIVERY_THRESHOLD_USD;
  const deliveryFeeUSD = freeDelivery ? 0 : deliveryFee;
  return {
    subtotalUSD,
    subtotalLBP,
    discountUSD,
    discountLBP,
    deliveryFeeUSD,
    totalUSD: subtotalUSD - discountUSD + deliveryFeeUSD,
    totalLBP: subtotalLBP - discountLBP,
    freeDelivery,
  };
}

// ── WhatsApp messages (spec formats) ──────────────────────────────────────────

function itemLine(i: CartItem): string {
  const variant = i.variant ? ` (${i.variant})` : "";
  return `• ${i.name}${variant} x${i.quantity} = ${formatUSD(
    i.priceUSD * i.quantity,
  )}`;
}

/** Cart-page WhatsApp message. */
export function buildCartWhatsAppMessage(
  items: CartItem[],
  totals: CartTotals,
): string {
  return [
    `Hi! I'd like to place an order:`,
    ``,
    ...items.map(itemLine),
    ``,
    `💰 Subtotal: ${formatUSD(totals.subtotalUSD)}`,
    ...(totals.discountUSD > 0
      ? [`🎁 Discount: -${formatUSD(totals.discountUSD)}`]
      : []),
    `📦 Delivery: ${totals.freeDelivery ? "Free" : formatUSD(totals.deliveryFeeUSD)}`,
    `💵 Total: ${formatUSD(totals.totalUSD)}`,
    ``,
    `Please confirm and arrange delivery. Thank you!`,
  ].join("\n");
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // full, incl. country code
}

export interface AddressDetails {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  notes?: string;
}

/** Checkout WhatsApp message — includes customer + address. */
export function buildCheckoutWhatsAppMessage(
  items: CartItem[],
  totals: CartTotals,
  customer: CustomerDetails,
  address: AddressDetails,
): string {
  const addressLine = [address.line1, address.line2, address.city, address.region]
    .filter(Boolean)
    .join(", ");
  return [
    `Hi! I'd like to place an order:`,
    ``,
    `👤 ${customer.firstName} ${customer.lastName}`,
    `📞 ${customer.phone}`,
    `📍 ${addressLine}`,
    ...(address.notes ? [`📝 Notes: ${address.notes}`] : []),
    ``,
    ...items.map(itemLine),
    ``,
    `💰 Subtotal: ${formatUSD(totals.subtotalUSD)}`,
    ...(totals.discountUSD > 0
      ? [`🎁 Discount: -${formatUSD(totals.discountUSD)}`]
      : []),
    `📦 Delivery: ${totals.freeDelivery ? "Free" : formatUSD(totals.deliveryFeeUSD)}`,
    `💵 Total: ${formatUSD(totals.totalUSD)}`,
    ``,
    `Please confirm and arrange delivery. Thank you!`,
  ].join("\n");
}

// ── Stored order (for the confirmation page) ──────────────────────────────────

export interface StoredOrder {
  orderNumber: string;
  items: Pick<
    CartItem,
    "name" | "variant" | "quantity" | "priceUSD" | "priceLBP"
  >[];
  customer: CustomerDetails;
  address: AddressDetails;
  paymentMethod: string;
  totals: CartTotals;
  createdAt: string;
  /** Order status from the DB (e.g. 'pending'). Set once the order is saved. */
  status?: string;
}

const ORDER_KEY = "yys-last-order";

export function generateOrderNumber(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `YYS-${n}`;
}

export function setLastOrder(order: StoredOrder): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
}

export function getLastOrder(): StoredOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ORDER_KEY);
    return raw ? (JSON.parse(raw) as StoredOrder) : null;
  } catch {
    return null;
  }
}

export const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  card: "Card Payment",
};
