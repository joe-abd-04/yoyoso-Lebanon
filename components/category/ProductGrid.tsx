"use client";

import type { Product } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onClear: () => void;
}

export default function ProductGrid({
  products,
  loading,
  onClear,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-white py-16 text-center">
        <span className="text-4xl" aria-hidden="true">
          🔍
        </span>
        <p className="mt-3 font-heading text-lg font-bold text-text-primary">
          No products found
        </p>
        <p className="mt-1 max-w-xs text-sm text-text-secondary">
          Try adjusting or clearing your filters to see more products.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-button bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          Clear All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
