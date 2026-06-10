"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, MessageCircle } from "lucide-react";
import { getWhatsAppNumber } from "@/lib/whatsapp";
import { formatUSD } from "@/lib/formatPrice";
import { useContactInfo } from "@/components/shared/SettingsProvider";
import { useHydrated } from "@/components/shared/useHydrated";
import { getLastOrder, type StoredOrder } from "@/components/cart/cart-utils";
import { orderStatusLabel, orderStatusStyle } from "@/lib/orders/status";

export default function ConfirmationView() {
  const hydrated = useHydrated();
  // The order is the real saved order, stashed by CheckoutView after a
  // successful insert. The cart was already cleared there (only on success), so
  // there is nothing to clear here.
  const [order] = useState<StoredOrder | null>(() => getLastOrder());

  const contact = useContactInfo();
  const waUrl = `https://wa.me/${getWhatsAppNumber(contact.whatsapp)}`;

  if (!hydrated) {
    return <div className="min-h-[40vh]" aria-hidden="true" />;
  }

  return (
    <div className="mx-auto max-w-[600px] text-center">
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white"
      >
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Check size={44} strokeWidth={3} />
        </motion.span>
      </motion.div>

      <h1 className="mt-5 font-heading text-2xl font-bold text-text-primary sm:text-3xl">
        Order Placed Successfully! 🎉
      </h1>
      <p className="mt-1 text-text-secondary">Thank you for your order</p>

      {order && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-block rounded-badge bg-surface px-4 py-1.5 text-sm font-bold text-text-primary">
            Order #{order.orderNumber}
          </span>
          <span
            className={`inline-block rounded-badge px-3 py-1.5 text-xs font-bold ${orderStatusStyle(
              order.status,
            )}`}
          >
            {orderStatusLabel(order.status)}
          </span>
        </div>
      )}

      {/* Summary card */}
      {order ? (
        <div className="mt-6 rounded-card border border-border bg-white p-5 text-left">
          <h2 className="font-heading text-base font-bold text-text-primary">
            Order Details
          </h2>

          <ul className="mt-3 space-y-2 border-b border-border pb-3">
            {order.items.map((item, i) => (
              <li
                key={`${item.name}-${item.variant}-${i}`}
                className="flex justify-between gap-3 text-sm"
              >
                <span className="text-text-primary">
                  {item.name}
                  {item.variant ? ` (${item.variant})` : ""} × {item.quantity}
                </span>
                <span className="shrink-0 font-medium text-text-primary">
                  {formatUSD(item.priceUSD * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-1.5 py-3 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span className="font-medium text-text-primary">
                {formatUSD(order.totals.subtotalUSD)}
              </span>
            </div>
            {order.totals.discountUSD > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="font-medium">
                  -{formatUSD(order.totals.discountUSD)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-text-secondary">
              <span>Delivery</span>
              <span className={`font-medium ${order.totals.freeDelivery ? "text-green-600" : "text-text-primary"}`}>
                {order.totals.freeDelivery ? "Free" : formatUSD(order.totals.deliveryFeeUSD)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-bold text-text-primary">Total</span>
              <span className="font-bold text-primary">
                {formatUSD(order.totals.totalUSD)}
              </span>
            </div>
          </div>

          <div className="space-y-1 border-t border-border pt-3 text-sm text-text-secondary">
            <p>
              <span className="font-medium text-text-primary">Delivery to:</span>{" "}
              {[
                order.address.line1,
                order.address.line2,
                order.address.city,
                order.address.region,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p>
              <span className="font-medium text-text-primary">Payment:</span>{" "}
              {order.paymentMethod}
            </p>
            <p>
              <span className="font-medium text-text-primary">
                Estimated delivery:
              </span>{" "}
              4 working days
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-text-secondary">
          Your order has been received. We&apos;ll be in touch shortly.
        </p>
      )}

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-button bg-whatsapp text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle size={18} />
          Chat with us on WhatsApp
        </a>
        <Link
          href="/"
          className="flex h-12 w-full items-center justify-center rounded-button border border-border text-sm font-bold text-text-primary transition-colors hover:border-primary"
        >
          Continue Shopping
        </Link>
      </div>

      <p className="mt-4 text-xs text-text-secondary">
        Questions? Message us anytime at {contact.phone}
      </p>
    </div>
  );
}
