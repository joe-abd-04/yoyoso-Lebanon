"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { Product, ProductBadge } from "@/data/products";
import { useCategoryBySlug } from "@/components/shared/CategoriesProvider";
import { formatUSD } from "@/lib/formatPrice";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

const BADGE_STYLES: Record<ProductBadge, string> = {
  SALE: "bg-[#FF7A6B] text-white",
  NEW: "bg-[#2BC4B6] text-white",
  HOT: "bg-[#FFB347] text-[#1F2A2A]",
};

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function deriveBadges(product: Product): ProductBadge[] {
  const set = new Set<ProductBadge>();
  if (product.discountPercent || product.badge === "SALE") set.add("SALE");
  if (
    Date.now() - new Date(product.createdAt).getTime() <= FOURTEEN_DAYS_MS &&
    !product.hideNewBadge
  ) set.add("NEW");
  if (product.isBestSeller || product.badge === "HOT") set.add("HOT");
  return [...set];
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const inWishlist = useWishlistStore((s) =>
    s.items.some((i) => i.productId === product.id),
  );
  const showToast = useUIStore((s) => s.showToast);

  const categoryName =
    useCategoryBySlug(product.category)?.name ?? product.category;

  const badges = deriveBadges(product);
  const colorVariants = product.variants.filter((v) => v.type === "color");
  const shownColors = colorVariants.slice(0, 4);
  const extraColors = colorVariants.length - shownColors.length;

  const handleAddToCart = () => {
    addItem(product);
    showToast(`✓ ${product.name} added to cart!`, "success");
  };

  const href = `/product/${product.slug}`;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-card bg-white shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.13)]">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-surface">
        <Link href={href} aria-label={product.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.thumbnail}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-400 group-hover:scale-[1.07]"
          />
        </Link>

        {/* Badge stack */}
        {badges.length > 0 && (
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
            {badges.map((b) => (
              <span
                key={b}
                className={cn(
                  "rounded-badge px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm",
                  BADGE_STYLES[b],
                )}
              >
                {b}
              </span>
            ))}
          </div>
        )}

        {/* Wishlist */}
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label="Add to wishlist"
          aria-pressed={inWishlist}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all hover:scale-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.16)]"
        >
          <Heart
            size={16}
            className={cn(
              "transition-colors duration-200",
              inWishlist ? "fill-[#FF7A6B] text-[#FF7A6B]" : "text-[#aaa]",
            )}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9aacac]">
          {categoryName}
        </p>

        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-[1.4] text-text-primary transition-colors hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-base font-extrabold text-primary">
              {formatUSD(product.priceUSD)}
            </span>
            {product.originalPriceUSD && (
              <span className="text-xs text-[#aaa] line-through">
                {formatUSD(product.originalPriceUSD)}
              </span>
            )}
            {product.discountPercent ? (
              <span className="rounded-badge bg-[#FF7A6B] px-1.5 py-0.5 text-[10px] font-bold text-white">
                -{product.discountPercent}%
              </span>
            ) : null}
          </div>
        </div>

        {/* Color swatches */}
        {shownColors.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {shownColors.map((v) => (
              <span
                key={v.value}
                title={v.value}
                className="h-3.5 w-3.5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
                style={{ backgroundColor: v.colorHex }}
              />
            ))}
            {extraColors > 0 && (
              <span className="text-[10px] text-[#999]">+{extraColors}</span>
            )}
          </div>
        )}

        {/* Add to cart */}
        <div className="mt-auto pt-3">
          <motion.button
            type="button"
            onClick={handleAddToCart}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            aria-label="Add to cart"
            className="h-9 w-full rounded-button bg-primary text-[13px] font-bold text-white transition-colors hover:bg-primary-dark"
          >
            Add to Cart
          </motion.button>
        </div>
      </div>
    </div>
  );
}
