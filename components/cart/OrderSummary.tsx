"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Check } from "lucide-react";
import { formatUSD } from "@/lib/formatPrice";
import {
  promoDiscountLabel,
  type AppliedPromo,
  type CartTotals,
} from "@/components/cart/cart-utils";
import { promoSchema } from "@/lib/validation";

interface OrderSummaryProps {
  totals: CartTotals;
  appliedPromo: AppliedPromo | null;
  onApplyPromo: (code: string) => boolean;
}

export default function OrderSummary({
  totals,
  appliedPromo,
  onApplyPromo,
}: OrderSummaryProps) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">(
    appliedPromo ? "ok" : "idle",
  );

  const handleApply = () => {
    // Reject malformed codes (wrong charset / too long) before checking them.
    const parsed = promoSchema.safeParse({ code });
    if (!parsed.success) {
      setStatus("error");
      return;
    }
    const ok = onApplyPromo(parsed.data.code);
    setStatus(ok ? "ok" : "error");
    if (ok) setCode("");
  };

  return (
    <div className="rounded-card border border-border bg-white p-5 lg:sticky lg:top-24">
      <h2 className="font-heading text-lg font-bold text-text-primary">
        Order Summary
      </h2>

      {/* Promo code */}
      <div className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            placeholder="Promo code"
            aria-label="Promo code"
            maxLength={40}
            className="min-w-0 flex-1 rounded-button border border-border px-3 py-2 text-sm uppercase focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApply}
            className="shrink-0 rounded-button bg-text-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Apply
          </button>
        </div>
        {status === "ok" && appliedPromo && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-green-600">
            <Check size={13} />
            Code {appliedPromo.code} applied — {promoDiscountLabel(appliedPromo)}
          </p>
        )}
        {status === "error" && (
          <p className="mt-1.5 text-xs font-medium text-primary">
            This promo code is invalid or expired.
          </p>
        )}
      </div>

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
            <span className="font-medium">
              -{formatUSD(totals.discountUSD)}
            </span>
          </div>
        )}
      </div>

      {/* Total */}
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

      {/* Actions */}
      <div className="mt-4 space-y-3">
        <Link
          href="/checkout"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-button bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          Proceed to Checkout
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* Trust */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-secondary">
        <Lock size={13} />
        Secure &amp; Safe Checkout
      </div>
      <p className="mt-2 text-center text-[11px] text-text-secondary">
        Card Payment · Cash on Delivery
      </p>
    </div>
  );
}
