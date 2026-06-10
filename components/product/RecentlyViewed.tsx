"use client";

import { useEffect, useState } from "react";
import { useProducts } from "@/components/shared/ProductsProvider";
import ProductRail from "@/components/product/ProductRail";

const STORAGE_KEY = "yys-recently-viewed";
const MAX = 8;

/** Read the stored list of recently-viewed product slugs. */
function readSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((s) => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

interface RecentlyViewedProps {
  /** The slug of the product currently being viewed (recorded, then excluded). */
  currentSlug: string;
}

export default function RecentlyViewed({ currentSlug }: RecentlyViewedProps) {
  const products = useProducts();

  // Lazy initializer reads localStorage once at mount — no setState-in-effect.
  // SSR returns [] (guarded), so first client render matches, then we may
  // re-render after the write effect only if the list changes.
  const [slugs] = useState<string[]>(() =>
    readSlugs().filter((s) => s !== currentSlug),
  );

  // Record the current product for future visits (write-only side effect).
  useEffect(() => {
    const existing = readSlugs().filter((s) => s !== currentSlug);
    const next = [currentSlug, ...existing].slice(0, MAX);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota / disabled storage
    }
  }, [currentSlug]);

  // Resolve slugs → products, preserving order.
  const viewed = slugs
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is (typeof products)[number] => Boolean(p));

  // Only show if the user has viewed another product before this one.
  if (viewed.length < 1) return null;

  return <ProductRail title="Recently Viewed" products={viewed} />;
}
