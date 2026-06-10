"use client";

import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";
import { useProducts } from "@/components/shared/ProductsProvider";
import ProductCard from "@/components/product/ProductCard";
import { useHydrated } from "@/components/shared/useHydrated";

export default function WishlistPage() {
  const hydrated = useHydrated();
  const wishlistItems = useWishlistStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const showToast = useUIStore((s) => s.showToast);
  const products = useProducts();

  // Resolve wishlist slugs → full product objects (for ProductCard).
  const wishedProducts = wishlistItems
    .map((w) => products.find((p) => p.id === w.productId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (!hydrated) {
    return <div className="min-h-[60vh]" aria-hidden="true" />;
  }

  if (wishedProducts.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF7A6B]/10">
            <Heart size={30} strokeWidth={1.5} className="text-[#FF7A6B]" />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold text-text-primary">
            Your wishlist is empty
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Save items you love and come back to them later
          </p>
          <Link
            href="/"
            className="mt-6 rounded-button bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const handleAddAll = () => {
    wishedProducts.forEach((p) => addItem(p));
    showToast(`✓ ${wishedProducts.length} items added to cart!`, "success");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
            My Wishlist
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {wishedProducts.length} item{wishedProducts.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddAll}
          className="flex items-center gap-2 rounded-button bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          <ShoppingCart size={16} />
          Add All to Cart
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {wishedProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          ← Continue Shopping
        </Link>
      </div>
    </div>
  );
}
