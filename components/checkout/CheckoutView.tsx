"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Check } from "lucide-react";
import Spinner from "@/components/shared/Spinner";
import { useCartStore } from "@/store/cartStore";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/components/shared/useHydrated";
import {
  useDeliveryFee,
  useActivePromo,
} from "@/components/shared/SettingsProvider";
import { checkoutSchema, LEBANON_REGIONS, type CheckoutInput } from "@/lib/validation";
import { useBotGuard, Honeypot } from "@/components/shared/botProtection";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import { placeOrder } from "@/app/(shop)/checkout/actions";
import {
  computeCartTotals,
  validatePromo,
  getStoredPromo,
  setLastOrder,
} from "@/components/cart/cart-utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldClass(hasError: boolean): string {
  return cn(
    "w-full rounded-button border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
    hasError ? "border-primary" : "border-border focus:border-primary",
  );
}

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs font-medium text-primary">{msg}</p>;
}

function SectionHeading({ step, title }: { step: number; title: string }) {
  return (
    <h2 className="mb-4 font-heading text-lg font-bold text-text-primary">
      <span className="mr-2 text-primary">{step}.</span>
      {title}
    </h2>
  );
}

export default function CheckoutView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);

  const deliveryFee = useDeliveryFee();
  const activePromo = useActivePromo();
  const promo = getStoredPromo();
  const totals = useMemo(
    () =>
      computeCartTotals(items, validatePromo(promo, activePromo), deliveryFee),
    [items, promo, deliveryFee, activePromo],
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutInput>({ resolver: zodResolver(checkoutSchema) });

  // The honeypot field is rendered (and will be validated server-side in Phase 9),
  // but the COD checkout does NOT block on any client-side bot heuristic. A
  // falsely-blocked paying customer is far worse than a harmless fake order —
  // submitting checkout has no server effect yet. Browser autofill commonly fills
  // hidden fields and would otherwise silently drop a real order. Bot rejection
  // stays active on the higher-value forms (contact, login, register, newsletter).
  const { honeypotRef } = useBotGuard({ formId: "checkout" });

  const w = watch();

  const steps = [
    {
      n: 1,
      label: "Information",
      done:
        !!w.firstName &&
        !!w.lastName &&
        EMAIL_RE.test(w.email ?? "") &&
        (w.phone ?? "").replace(/\D/g, "").length >= 8,
    },
    {
      n: 2,
      label: "Delivery",
      done: !!w.address1 && !!w.city && !!w.region,
    },
    { n: 3, label: "Payment", done: true },
  ];

  const onValid = async (data: CheckoutInput) => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      // The server re-validates everything, recomputes all totals from
      // authoritative DB prices + the settings delivery fee, links the order to
      // the logged-in user (if any), and persists it. We only send the cart
      // line identity (id/variant/qty) — never prices.
      const result = await placeOrder({
        ...data,
        items: items.map((i) => ({
          productId: i.productId,
          variant: i.variant,
          quantity: i.quantity,
        })),
        promoCode: promo ?? undefined,
      });

      if (!result.ok) {
        // Failure: keep the cart intact so the customer can retry.
        setErrorMsg(result.error);
        setSubmitting(false);
        return;
      }

      // Success: stash the real saved order for the confirmation page, then
      // clear the cart.
      setLastOrder(result.order);
      clearCart();
      router.push("/checkout/confirmation");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[checkout] placeOrder failed:", err);
      }
      setErrorMsg(
        "Something went wrong placing your order. Please try again in a moment.",
      );
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return <div className="min-h-[40vh]" aria-hidden="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-white py-16 text-center">
        <span className="text-5xl" aria-hidden="true">🛒</span>
        <h2 className="mt-4 font-heading text-xl font-bold text-text-primary">
          Your cart is empty
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Add some products before checking out.
        </p>
        <Link
          href="/"
          className="mt-5 rounded-button bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
        {steps.map((s, idx) => (
          <div key={s.n} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  s.done
                    ? "bg-primary text-white"
                    : "border border-border text-text-secondary",
                )}
              >
                {s.done ? <Check size={14} /> : s.n}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold sm:text-sm",
                  s.done ? "text-text-primary" : "text-text-secondary",
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <span className="h-px w-4 bg-border sm:w-8" />
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit(onValid, (errs) => {
          if (process.env.NODE_ENV === "development") {
            console.error("[checkout] validation errors:", errs);
          }
        })}
        className="relative flex flex-col gap-8 lg:grid lg:grid-cols-[3fr_2fr]"
      >
        <Honeypot inputRef={honeypotRef} />
        {/* Summary — top on mobile, right on desktop */}
        <div className="order-1 lg:order-2">
          <CheckoutSummary items={items} totals={totals} />
        </div>

        {/* Form — bottom on mobile, left on desktop */}
        <div className="order-2 space-y-8 lg:order-1">
          {/* Step 1: Information */}
          <section>
            <SectionHeading step={1} title="Customer Information" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">
                  First Name *
                </label>
                <input
                  maxLength={100}
                  className={fieldClass(!!errors.firstName)}
                  {...register("firstName")}
                />
                <ErrorText msg={errors.firstName?.message} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">
                  Last Name *
                </label>
                <input
                  maxLength={100}
                  className={fieldClass(!!errors.lastName)}
                  {...register("lastName")}
                />
                <ErrorText msg={errors.lastName?.message} />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Email Address *
              </label>
              <input
                type="email"
                maxLength={254}
                className={fieldClass(!!errors.email)}
                {...register("email")}
              />
              <ErrorText msg={errors.email?.message} />
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Phone Number *
              </label>
              <div className="flex gap-2">
                <span className="flex shrink-0 items-center rounded-button border border-border bg-surface px-3 text-sm text-text-primary">
                  🇱🇧 +961
                </span>
                <div className="flex-1">
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="03 133 307"
                    maxLength={30}
                    className={fieldClass(!!errors.phone)}
                    {...register("phone")}
                  />
                </div>
              </div>
              <ErrorText msg={errors.phone?.message} />
            </div>
          </section>

          {/* Step 2: Delivery */}
          <section>
            <SectionHeading step={2} title="Delivery Address" />
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Address Line 1 *
              </label>
              <input
                maxLength={200}
                className={fieldClass(!!errors.address1)}
                {...register("address1")}
              />
              <ErrorText msg={errors.address1?.message} />
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Address Line 2
              </label>
              <input
                placeholder="Apartment, floor, etc."
                maxLength={200}
                className={fieldClass(false)}
                {...register("address2")}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">
                  City / Area *
                </label>
                <input
                  maxLength={100}
                  className={fieldClass(!!errors.city)}
                  {...register("city")}
                />
                <ErrorText msg={errors.city?.message} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">
                  Region / Governorate *
                </label>
                <select
                  className={fieldClass(!!errors.region)}
                  defaultValue=""
                  {...register("region")}
                >
                  <option value="" disabled>
                    Select region
                  </option>
                  {LEBANON_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ErrorText msg={errors.region?.message} />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Delivery Notes
              </label>
              <textarea
                rows={3}
                placeholder="Any special instructions for delivery?"
                maxLength={1000}
                className={fieldClass(false)}
                {...register("notes")}
              />
            </div>
          </section>

          {/* Step 3: Payment — static info, COD only */}
          <section>
            <SectionHeading step={3} title="Payment Method" />
            <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-4">
              <span className="text-xl" aria-hidden="true">💵</span>
              <div>
                <p className="text-sm font-bold text-text-primary">
                  Cash on Delivery
                </p>
                <p className="text-xs text-text-secondary">
                  Pay when your order arrives
                </p>
              </div>
            </div>

            {errorMsg && (
              <p
                role="alert"
                className="mt-4 rounded-button border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
              >
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-primary text-base font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Spinner size={18} className="text-white" />
                  Placing Order...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Place Order
                </>
              )}
            </button>
          </section>
        </div>
      </form>
    </div>
  );
}
