"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Heart } from "lucide-react";
import type { Product } from "@/data/products";
import { formatUSD } from "@/lib/formatPrice";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import ProductVariants from "@/components/product/ProductVariants";
import QuantitySelector from "@/components/product/QuantitySelector";
import ProductAccordion from "@/components/product/ProductAccordion";
import StickyMobileBar from "@/components/product/StickyMobileBar";

interface ProductInfoProps {
  product: Product;
  /**
   * Called when the customer selects a color/model that has an assigned image,
   * so the gallery can switch to it. Options without an image don't fire this
   * (the gallery keeps showing the current photo — graceful fallback).
   */
  onVariantImageChange?: (imageUrl: string) => void;
}

const TRUST_ITEMS = [
  { icon: "🔄", label: "Easy Returns" },
  { icon: "🚚", label: "Fast Delivery" },
  { icon: "✅", label: "Secure Payment" },
];

export default function ProductInfo({
  product,
  onVariantImageChange,
}: ProductInfoProps) {
  const colors = product.variants.filter((v) => v.type === "color");
  const models = product.variants.filter((v) => v.type === "model");
  const sizes = product.variants.filter((v) => v.type === "size");

  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors[0]?.value ?? null,
  );
  const [selectedModel, setSelectedModel] = useState<string | null>(
    models[0]?.value ?? null,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes[0]?.value ?? null,
  );
  const [quantity, setQuantity] = useState(1);

  // Switch the gallery when a chosen color/model has an assigned image.
  const handleColorChange = (value: string) => {
    setSelectedColor(value);
    const v = colors.find((c) => c.value === value);
    if (v?.image) onVariantImageChange?.(v.image);
  };
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    const v = models.find((m) => m.value === value);
    if (v?.image) onVariantImageChange?.(v.image);
  };

  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const inWishlist = useWishlistStore((s) =>
    s.items.some((i) => i.productId === product.id),
  );
  const showToast = useUIStore((s) => s.showToast);

  // Combined variant label for the cart line (color / model / size, in order).
  const variantLabel =
    [selectedColor, selectedModel, selectedSize].filter(Boolean).join(" / ") ||
    null;

  const handleAddToCart = () => {
    if (!product.inStock) return;
    addItem(product, { quantity, variant: variantLabel ?? undefined });
    showToast(`✓ ${product.name} added to cart!`, "success");
  };

  return (
    <div>
      {/* Title */}
      <h1 className="font-heading text-2xl font-bold leading-tight text-text-primary sm:text-3xl">
        {product.name}
      </h1>

      {/* SKU */}
      {product.sku && (
        <p className="mt-1 text-xs text-text-secondary">SKU: {product.sku}</p>
      )}

      {/* Price block */}
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xl font-bold text-primary">
            {formatUSD(product.priceUSD)}
          </span>
          {product.originalPriceUSD && (
            <span className="text-base text-text-secondary line-through">
              {formatUSD(product.originalPriceUSD)}
            </span>
          )}
          {product.discountPercent ? (
            <span className="rounded-badge bg-primary px-2.5 py-1 text-xs font-bold text-white">
              -{product.discountPercent}% OFF
            </span>
          ) : null}
        </div>
      </div>

      {/* Availability */}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            product.inStock ? "bg-green-500" : "bg-border",
          )}
        />
        <span
          className={cn(
            "font-medium",
            product.inStock ? "text-green-600" : "text-text-secondary",
          )}
        >
          {product.inStock ? "In Stock" : "Out of Stock"}
        </span>
      </div>

      {/* Variants */}
      {(colors.length > 0 || models.length > 0 || sizes.length > 0) && (
        <div className="mt-5">
          <ProductVariants
            colors={colors}
            models={models}
            sizes={sizes}
            selectedColor={selectedColor}
            selectedModel={selectedModel}
            selectedSize={selectedSize}
            onColorChange={handleColorChange}
            onModelChange={handleModelChange}
            onSizeChange={setSelectedSize}
          />
        </div>
      )}

      {/* Quantity */}
      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-text-primary">Quantity:</p>
        <QuantitySelector value={quantity} onChange={setQuantity} />
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <motion.button
          type="button"
          onClick={handleAddToCart}
          disabled={!product.inStock}
          whileTap={product.inStock ? { scale: 0.98 } : undefined}
          className={cn(
            "flex h-[52px] w-full items-center justify-center gap-2 rounded-button text-base font-bold transition-colors",
            product.inStock
              ? "bg-primary text-white hover:bg-primary-dark"
              : "cursor-not-allowed bg-border text-text-secondary",
          )}
        >
          <ShoppingCart size={20} />
          {product.inStock ? "Add to Cart" : "Out of Stock"}
        </motion.button>

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button border border-border text-base font-bold text-text-primary transition-colors hover:border-primary"
        >
          <Heart
            size={20}
            className={cn(inWishlist && "fill-primary text-primary")}
          />
          {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
        </button>
      </div>

      {/* Trust row */}
      <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-4">
        {TRUST_ITEMS.map((t) => (
          <div
            key={t.label}
            className="flex flex-col items-center gap-1 text-center text-xs text-text-secondary"
          >
            <span className="text-lg" aria-hidden="true">
              {t.icon}
            </span>
            {t.label}
          </div>
        ))}
      </div>

      {/* Details accordions */}
      <div className="mt-6">
        <ProductAccordion title="Description" defaultOpen>
          <p className="leading-relaxed">
            {product.description ??
              "No description available for this product yet."}
          </p>
        </ProductAccordion>

        {product.specifications &&
          Object.keys(product.specifications).length > 0 && (
            <ProductAccordion title="Specifications">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(product.specifications).map(
                    ([key, value], i) => (
                      <tr
                        key={key}
                        className={cn(i % 2 === 1 && "bg-surface")}
                      >
                        <td className="py-2 pr-4 font-medium text-text-primary">
                          {key}
                        </td>
                        <td className="py-2 text-text-secondary">{value}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </ProductAccordion>
          )}

        <ProductAccordion title="Delivery & Returns">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Delivery: 4 working days across Lebanon</li>
            <li>Exchange or store credit within 14 days (no cash refunds)</li>
            <li>Items must be unused and in original packaging</li>
          </ul>
        </ProductAccordion>

        <ProductAccordion title="Payment Methods">
          <ul className="space-y-1.5">
            <li>💵 Cash on Delivery ✓</li>
            <li>💬 WhatsApp Checkout ✓</li>
          </ul>
        </ProductAccordion>
      </div>

      {/* Sticky mobile bar */}
      <StickyMobileBar
        priceUSD={product.priceUSD * quantity}
        inStock={product.inStock}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
