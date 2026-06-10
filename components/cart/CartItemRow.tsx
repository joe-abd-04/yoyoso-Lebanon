"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { CartItem } from "@/store/cartStore";
import { useCartStore } from "@/store/cartStore";
import { formatUSD } from "@/lib/formatPrice";
import QuantitySelector from "@/components/product/QuantitySelector";

interface CartItemRowProps {
  item: CartItem;
}

export default function CartItemRow({ item }: CartItemRowProps) {
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 border-b border-border py-4"
    >
      {/* Image */}
      <Link
        href={`/product/${item.slug}`}
        className="shrink-0"
        aria-label={item.name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnail}
          alt={item.name}
          loading="lazy"
          className="h-20 w-20 rounded-button object-cover"
        />
      </Link>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/product/${item.slug}`}
              className="line-clamp-2 text-sm font-bold text-text-primary transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
            {item.variant && (
              <p className="mt-0.5 text-xs text-text-secondary">
                {item.variant}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.productId, item.variant)}
            aria-label={`Remove ${item.name}`}
            className="shrink-0 p-1 text-text-secondary transition-colors hover:text-primary"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
          {/* Unit price */}
          <div>
            <p className="text-sm font-bold text-primary">
              {formatUSD(item.priceUSD)}
            </p>
          </div>

          {/* Quantity */}
          <QuantitySelector
            value={item.quantity}
            onChange={(q) => updateQty(item.productId, q, item.variant)}
          />

          {/* Line total */}
          <p className="text-sm font-bold text-text-primary">
            {formatUSD(item.priceUSD * item.quantity)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
