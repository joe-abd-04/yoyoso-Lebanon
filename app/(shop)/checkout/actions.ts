"use server";

// SERVER ACTION — persists a Cash-on-Delivery order to the database.
//
// Security model (money + RLS):
//  - Everything the client sends is re-validated here with zod.
//  - Prices are NEVER trusted from the client: every line's price is looked up
//    from the catalog in the DB by product id, and subtotal/delivery/total are
//    recomputed server-side from those authoritative values + the settings
//    delivery fee.
//  - The insert uses the service-role server client (server-only, never shipped
//    to the browser). user_id is taken from the verified session (getCurrentUser),
//    never from client input, so it can't be spoofed.
//  - Guests are fully supported: user_id is simply null.

import { z } from "zod";
import { getProducts } from "@/lib/data/products";
import { getDeliveryFee, getActivePromo } from "@/lib/data/settings";
import { getCurrentUser } from "@/lib/supabase/server-auth";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, RL } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import { sanitizeText } from "@/lib/sanitize";
import { checkoutSchema, LIMITS } from "@/lib/validation";
import {
  computeCartTotals,
  validatePromo,
  PAYMENT_LABELS,
  type StoredOrder,
} from "@/components/cart/cart-utils";
import { sendOrderConfirmationEmail } from "@/lib/email/orderConfirmation";
import type { CartItem } from "@/store/cartStore";
import type { OrderItem, OrderInsert, Order } from "@/lib/supabase/types";

// COD only for now (see CheckoutView). DB stores the canonical value.
const PAYMENT_METHOD_DB = "cash_on_delivery";
const MAX_ORDER_NUMBER_ATTEMPTS = 5;

const orderItemSchema = z.object({
  productId: z.string().trim().min(1).max(100),
  variant: z.string().max(120).optional().default(""),
  quantity: z.number().int().min(1).max(99),
});

// The customer/address fields reuse the exact same schema as the client form,
// plus the cart lines and an optional promo code.
const placeOrderSchema = checkoutSchema.extend({
  items: z.array(orderItemSchema).min(1, "Your cart is empty").max(100),
  promoCode: z.string().max(LIMITS.promo).optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export type PlaceOrderResult =
  | { ok: true; order: StoredOrder }
  | { ok: false; error: string };

function generateOrderNumber(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `YYS-${n}`;
}

/** Round to 2 decimals so money columns never store float noise. */
function money(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function placeOrder(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  // 0. Rate limit per IP to stop order flooding (burst + sustained windows).
  //    Fails open if the limiter store errors (a real customer must never be
  //    blocked from checking out by an infra hiccup).
  const ip = await getClientIp();
  const ipKey = ip ?? "unknown";
  const burstOk = await checkRateLimit(
    `placeOrder:ip:${ipKey}`,
    RL.placeOrder.burst,
  );
  const sustainedOk = await checkRateLimit(
    `placeOrder:sustained:ip:${ipKey}`,
    RL.placeOrder.sustained,
  );
  if (!burstOk || !sustainedOk) {
    return {
      ok: false,
      error:
        "You're placing orders too quickly. Please wait a moment and try again.",
    };
  }

  // 1. Validate shape/size of everything the client sent.
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your details and try again." };
  }
  const data = parsed.data;

  // 2. Resolve authoritative product data from the DB — never trust client prices.
  const catalog = await getProducts();
  const byId = new Map(catalog.map((p) => [p.id, p]));

  const authoritativeItems: CartItem[] = [];
  const orderItems: OrderItem[] = [];

  for (const line of data.items) {
    const product = byId.get(line.productId);
    if (!product) {
      return {
        ok: false,
        error:
          "One or more items are no longer available. Please review your cart and try again.",
      };
    }
    const variant = sanitizeText(line.variant ?? "");
    authoritativeItems.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceUSD: product.priceUSD,
      priceLBP: product.priceLBP,
      thumbnail: product.thumbnail,
      variant,
      quantity: line.quantity,
    });
    orderItems.push({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      thumbnail: product.thumbnail,
      price_usd: money(product.priceUSD),
      quantity: line.quantity,
      variant: variant || undefined,
      // Snapshot the SKU so it's preserved even if the product changes later.
      sku: product.sku || undefined,
    });
  }

  if (authoritativeItems.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  // 3. Recompute all money server-side: authoritative prices + DB delivery fee.
  //    (Same helper the cart/checkout UI uses, so totals stay consistent —
  //    including the free-delivery threshold.)
  const deliveryFee = await getDeliveryFee();
  const activePromo = await getActivePromo();
  const promo = validatePromo(data.promoCode, activePromo);
  const totals = computeCartTotals(authoritativeItems, promo, deliveryFee);

  // 4. Link to the user only if logged in (read from the session, not the client).
  const user = await getCurrentUser();

  // 5. Insert via service role (server-only). Generate a unique order number,
  //    retrying on the rare collision (unique_violation = 23505).
  const supabase = createServerClient();
  const baseInsert: Omit<OrderInsert, "order_number"> = {
    user_id: user?.id ?? null,
    customer_name: `${sanitizeText(data.firstName)} ${sanitizeText(
      data.lastName,
    )}`.trim(),
    customer_email: data.email,
    customer_phone: `+961 ${data.phone}`,
    address_line1: sanitizeText(data.address1),
    address_line2: data.address2 ? sanitizeText(data.address2) : null,
    city: sanitizeText(data.city),
    region: data.region,
    delivery_notes: data.notes ? sanitizeText(data.notes) : null,
    items: orderItems,
    subtotal_usd: money(totals.subtotalUSD),
    delivery_fee_usd: money(totals.deliveryFeeUSD),
    discount_usd: money(totals.discountUSD),
    total_usd: money(totals.totalUSD),
    payment_method: PAYMENT_METHOD_DB,
    status: "pending",
  };

  let inserted: Order | null = null;

  for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
    const order_number = generateOrderNumber();
    const { data: row, error } = await supabase
      .from("orders")
      .insert({ ...baseInsert, order_number })
      .select("*")
      .single();

    if (!error && row) {
      inserted = row;
      break;
    }
    // 23505 = unique_violation on order_number → retry with a fresh number.
    if (error && error.code === "23505") continue;
    if (error) {
      console.error("[placeOrder] insert error:", error.message);
      return {
        ok: false,
        error: "We couldn't place your order. Please try again.",
      };
    }
  }

  if (!inserted) {
    return {
      ok: false,
      error: "We couldn't place your order. Please try again.",
    };
  }

  // 6. Build the confirmation snapshot the client shows on /checkout/confirmation.
  const order: StoredOrder = {
    orderNumber: inserted.order_number,
    items: authoritativeItems.map((i, idx) => ({
      name: i.name,
      variant: i.variant,
      quantity: i.quantity,
      priceUSD: i.priceUSD,
      priceLBP: i.priceLBP,
      // SKU snapshot (from the authoritative DB product) for the email receipt.
      sku: orderItems[idx]?.sku,
    })),
    customer: {
      firstName: sanitizeText(data.firstName),
      lastName: sanitizeText(data.lastName),
      email: data.email,
      phone: `+961 ${data.phone}`,
    },
    address: {
      line1: sanitizeText(data.address1),
      line2: data.address2 ? sanitizeText(data.address2) : undefined,
      city: sanitizeText(data.city),
      region: data.region,
      notes: data.notes ? sanitizeText(data.notes) : undefined,
    },
    paymentMethod: PAYMENT_LABELS.cod,
    totals,
    createdAt: inserted.created_at,
    status: inserted.status,
  };

  // 7. Fire the (stubbed) confirmation email — must NEVER fail the order.
  try {
    await sendOrderConfirmationEmail(order);
  } catch (err) {
    console.error("[placeOrder] confirmation email failed:", err);
  }

  return { ok: true, order };
}
