"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useProducts } from "@/components/shared/ProductsProvider";
import {
  useDeliveryFee,
  useActivePromo,
} from "@/components/shared/SettingsProvider";
import type { Product } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";
import { useHydrated } from "@/components/shared/useHydrated";
import CartItemRow from "@/components/cart/CartItemRow";
import OrderSummary from "@/components/cart/OrderSummary";
import {
  computeCartTotals,
  validatePromo,
  getStoredPromo,
  setStoredPromo,
} from "@/components/cart/cart-utils";

function EmptyCart({ suggestions }: { suggestions: Product[] }) {
  return (
    <div>
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-white py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <ShoppingBag size={30} strokeWidth={1.5} className="text-primary" />
        </div>
        <h2 className="mt-4 font-heading text-xl font-bold text-text-primary">
          Your cart is empty
        </h2>
        <p className="mt-1.5 text-sm text-text-secondary">
          Looks like you haven&apos;t added anything yet
        </p>
        <Link
          href="/"
          className="mt-6 rounded-button bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
        >
          Continue Shopping
        </Link>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 font-heading text-xl font-bold text-text-primary">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function CartView() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const products = useProducts();
  const suggestions = useMemo(
    () => products.filter((p) => p.isFeatured).slice(0, 4),
    [products],
  );

  const deliveryFee = useDeliveryFee();
  const activePromo = useActivePromo();
  const [promo, setPromo] = useState<string | null>(() => getStoredPromo());

  const applied = useMemo(
    () => validatePromo(promo, activePromo),
    [promo, activePromo],
  );

  const totals = useMemo(
    () => computeCartTotals(items, applied, deliveryFee),
    [items, applied, deliveryFee],
  );

  const applyPromo = (code: string): boolean => {
    const valid = validatePromo(code, activePromo);
    if (!valid) return false;
    setPromo(valid.code);
    setStoredPromo(valid.code);
    return true;
  };

  // Avoid hydration mismatch: render nothing meaningful until client-mounted.
  if (!hydrated) {
    return <div className="min-h-[40vh]" aria-hidden="true" />;
  }

  if (items.length === 0) {
    return <EmptyCart suggestions={suggestions} />;
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        {/* Items */}
        <div>
          <div className="rounded-card border border-border bg-white px-4">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <CartItemRow
                  key={`${item.productId}-${item.variant}`}
                  item={item}
                />
              ))}
            </AnimatePresence>
          </div>

          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
        </div>

        {/* Summary */}
        <OrderSummary
          totals={totals}
          appliedPromo={applied}
          onApplyPromo={applyPromo}
        />
      </div>

      {/* You may also like */}
      {suggestions.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 font-heading text-xl font-bold text-text-primary">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
