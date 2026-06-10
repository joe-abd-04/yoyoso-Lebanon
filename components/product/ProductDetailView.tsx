"use client";

// Client wrapper that pairs the image gallery with the product info panel so a
// variant selection (color/model with an assigned image) can switch the main
// gallery photo. The wrapper owns the active-image index; ProductInfo reports a
// variant's image, and we map it to the matching gallery index. If the chosen
// option has no image, nothing changes (graceful fallback).

import { useMemo, useState } from "react";
import type { Product } from "@/data/products";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductInfo from "@/components/product/ProductInfo";

export default function ProductDetailView({
  product,
  badge,
}: {
  product: Product;
  badge?: string | null;
}) {
  const images = useMemo(
    () => (product.images.length > 0 ? product.images : [""]),
    [product.images],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const handleVariantImage = (imageUrl: string) => {
    const idx = images.indexOf(imageUrl);
    if (idx >= 0) setActiveIndex(idx);
  };

  return (
    <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
      <ProductImageGallery
        images={product.images}
        productName={product.name}
        badge={badge}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
      />
      <ProductInfo product={product} onVariantImageChange={handleVariantImage} />
    </div>
  );
}
