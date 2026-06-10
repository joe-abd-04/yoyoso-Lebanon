// SERVER-ONLY data access for products.
// Uses the service-role server client, so only import this from Server
// Components / Route Handlers — never from a 'use client' file. Client
// components receive the catalog via <ProductsProvider> (see
// components/shared/ProductsProvider.tsx).
//
// Returns the existing UI `Product` shape (from data/products.ts) so
// presentational components don't change. The DB stores only USD prices and a
// category_id; we derive the LBP prices + discount percent and resolve the
// category slug here, exactly like the static makeProduct() did.
//
// The static data/products.ts file is kept as a backup: if the DB is
// unreachable or returns nothing, we fall back to it so the catalog never
// disappears.

import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";
import {
  products as staticProducts,
  usdToLbp,
  type Product,
  type ProductVariant,
} from "@/data/products";
import type { Product as ProductRow } from "@/lib/supabase/types";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/products/placeholder";

/** Map a DB product row (+ resolved category slug) into the UI Product shape. */
function mapRow(row: ProductRow, categorySlug: string): Product {
  // Products created in the admin panel may not have images yet (upload arrives
  // in Phase 9.5 step 3). Fall back to a neutral placeholder so cards/galleries
  // never render an empty/broken image.
  const images = row.images.length > 0 ? row.images : [PRODUCT_IMAGE_PLACEHOLDER];
  const thumbnail = row.thumbnail || images[0];
  const priceLBP = usdToLbp(row.price_usd);
  const originalPriceLBP =
    row.original_price_usd != null ? usdToLbp(row.original_price_usd) : undefined;
  const discountPercent =
    row.original_price_usd && row.original_price_usd > row.price_usd
      ? Math.round(
          ((row.original_price_usd - row.price_usd) / row.original_price_usd) *
            100,
        )
      : undefined;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: categorySlug,
    subcategory: row.subcategory ?? "",
    priceUSD: row.price_usd,
    priceLBP,
    originalPriceUSD: row.original_price_usd ?? undefined,
    originalPriceLBP,
    discountPercent,
    images,
    thumbnail,
    badge: row.badge ?? undefined,
    hideNewBadge: row.hide_new_badge,
    isNew: false,
    isBestSeller: row.is_best_seller,
    isFeatured: row.is_featured,
    inStock: row.in_stock,
    stockCount: row.stock_count ?? undefined,
    variants: (row.variants ?? []) as ProductVariant[],
    description: row.description,
    sku: row.sku ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
  };
}

/**
 * Every product, mapped to the UI shape. Wrapped in React.cache so multiple
 * callers in the same server render (e.g. layout + page) share one query.
 * Falls back to the static catalog if the DB can't be read.
 */
export const getProducts = cache(async (): Promise<Product[]> => {
  try {
    const supabase = createServerClient();
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from("products").select("*"),
      supabase.from("categories").select("*"),
    ]);

    const { data: productRows, error: pErr } = productsRes;
    const { data: catRows, error: cErr } = categoriesRes;

    if (pErr || cErr || !productRows || !catRows || productRows.length === 0) {
      if (pErr) console.error("[getProducts] products error:", pErr.message);
      if (cErr) console.error("[getProducts] categories error:", cErr.message);
      return staticProducts;
    }

    const slugById = new Map(catRows.map((c) => [c.id, c.slug]));
    return productRows.map((row) =>
      mapRow(row, slugById.get(row.category_id) ?? ""),
    );
  } catch (err) {
    console.error("[getProducts] Unexpected error:", err);
    return staticProducts;
  }
});

/** A single product by slug, or undefined. */
export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}

/** Products in a given category slug. */
export async function getProductsByCategory(
  categorySlug: string,
): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.category === categorySlug);
}

/** Featured products. */
export async function getFeaturedProducts(): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.isFeatured);
}

/** Best-seller products. */
export async function getBestSellers(): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.isBestSeller);
}

/** Products sorted by created_at descending (newest first). Pass limit to cap. */
export async function getNewArrivals(limit?: number): Promise<Product[]> {
  const sorted = [...(await getProducts())].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

/** Other products in the same category (excludes the current slug). */
export async function getRelatedProducts(
  categorySlug: string,
  currentSlug: string,
  limit = 8,
): Promise<Product[]> {
  return (await getProducts())
    .filter((p) => p.category === categorySlug && p.slug !== currentSlug)
    .slice(0, limit);
}
