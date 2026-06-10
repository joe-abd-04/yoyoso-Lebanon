"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { formatUSD } from "@/lib/formatPrice";

interface StickyMobileBarProps {
  priceUSD: number;
  inStock: boolean;
  onAddToCart: () => void;
}

export default function StickyMobileBar({
  priceUSD,
  inStock,
  onAddToCart,
}: StickyMobileBarProps) {
  const [visible, setVisible] = useState(false);

  // Show once the user scrolls past the hero/action area (~480px).
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.1)] md:hidden"
        >
          <span className="shrink-0 text-lg font-bold text-primary">
            {formatUSD(priceUSD)}
          </span>

          <button
            type="button"
            onClick={onAddToCart}
            disabled={!inStock}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-button bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-border disabled:text-text-secondary"
          >
            <ShoppingCart size={16} />
            {inStock ? "Add to Cart" : "Out of Stock"}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
