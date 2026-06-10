"use client";

import Link from "next/link";
import type { CartItem } from "@/store/cartStore";
import { formatUSD } from "@/lib/formatPrice";
import type { CartTotals } from "@/components/cart/cart-utils";

interface CheckoutSummaryProps {
  items: CartItem[];
  totals: CartTotals;
}

export default function CheckoutSummary({ items, totals }: CheckoutSummaryProps) {
  return (
    <div className="rounded-card border border-border bg-white p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-text-primary">
          Order Summary
        </h2>
        <Link
          href="/cart"
          className="text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          Edit cart
        </Link>
      </div>

      {/* Mini items */}
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={`${item.productId}-${item.variant}`}
            className="flex items-center gap-3"
          >
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.thumbnail}
                alt={item.name}
                loading="lazy"
                className="h-12 w-12 rounded-button object-cover"
              />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-text-primary px-1 text-[10px] font-bold text-white">
                {item.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-semibold text-text-primary">
                {item.name}
              </p>
              {item.variant && (
                <p className="text-[11px] text-text-secondary">{item.variant}</p>
              )}
            </div>
            <span className="text-xs font-bold text-text-primary">
              {formatUSD(item.priceUSD * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-text-secondary">Subtotal</span>
          <span className="font-medium text-text-primary">
            {formatUSD(totals.subtotalUSD)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Delivery</span>
          <span className={`font-medium ${totals.freeDelivery ? "text-green-600" : "text-text-primary"}`}>
            {totals.freeDelivery ? "Free" : formatUSD(totals.deliveryFeeUSD)}
          </span>
        </div>
        {totals.discountUSD > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span className="font-medium">-{formatUSD(totals.discountUSD)}</span>
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <div className="flex items-baseline justify-between">
          <span className="font-heading text-base font-bold text-text-primary">
            Total
          </span>
          <span className="font-heading text-xl font-bold text-primary">
            {formatUSD(totals.totalUSD)}
          </span>
        </div>
      </div>
    </div>
  );
}
