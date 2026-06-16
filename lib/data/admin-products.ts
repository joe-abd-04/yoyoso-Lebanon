// SERVER-ONLY data access for the ADMIN product screens.
// Uses the service-role server client, so import ONLY from Server Components /
// Server Actions inside /admin (which are gated by requireAdmin()).
//
// Unlike lib/data/products.ts (which loads the whole catalog for the storefront),
// this paginates at the database level with .range() + an exact count, so it
// scales to a large catalog (e.g. 2000 products) without ever loading them all.

import { createServerClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/products/placeholder";
import { colorHexByName } from "@/lib/products/colors";
import type { Product as ProductRow } from "@/lib/supabase/types";
import type { AdminProductInput } from "@/lib/validation";

export const ADMIN_PAGE_SIZE = 20;

export type StockFilter = "all" | "in" | "out";

export type AdminProductListItem = {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  priceUSD: number;
  originalPriceUSD: number | null;
  inStock: boolean;
  badge: string | null;
  hideNewBadge: boolean;
  thumbnail: string;
  createdAt: string;
};

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  subcategories: { name: string; slug: string }[];
};

/** Parent categories (with their subcategories) for the product form dropdowns. */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    if (error) console.error("[getCategoryOptions]", error.message);
    return [];
  }

  return data
    .filter((c) => c.parent_id === null)
    .map<CategoryOption>((parent) => ({
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
      subcategories: data
        .filter((c) => c.parent_id === parent.id)
        .map((c) => ({ name: c.name, slug: c.slug })),
    }));
}

export type ListAdminProductsResult = {
  items: AdminProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** One page of products matching the given filters, newest first. */
export async function listAdminProducts(opts: {
  page?: number;
  search?: string;
  categoryId?: string;
  stock?: StockFilter;
}): Promise<ListAdminProductsResult> {
  const supabase = createServerClient();
  const pageSize = ADMIN_PAGE_SIZE;
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("products").select("*", { count: "exact" });

  const search = opts.search?.trim();
  if (search) query = query.ilike("name", `%${search}%`);
  if (opts.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts.stock === "in") query = query.eq("in_stock", true);
  if (opts.stock === "out") query = query.eq("in_stock", false);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[listAdminProducts]", error.message);
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // Resolve category names (small table; one extra query).
  const { data: cats } = await supabase.from("categories").select("*");
  const nameById = new Map((cats ?? []).map((c) => [c.id, c.name]));

  const items: AdminProductListItem[] = (data ?? []).map((r: ProductRow) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    categoryName: nameById.get(r.category_id) ?? "—",
    priceUSD: r.price_usd,
    originalPriceUSD: r.original_price_usd,
    inStock: r.in_stock,
    badge: r.badge,
    hideNewBadge: r.hide_new_badge,
    thumbnail: r.thumbnail || PRODUCT_IMAGE_PLACEHOLDER,
    createdAt: r.created_at,
  }));

  const total = count ?? 0;
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/** A single raw product row by id (for the edit form), or null. */
export async function getAdminProductById(
  id: string,
): Promise<ProductRow | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getAdminProductById]", error.message);
    return null;
  }
  return data;
}

/** Keep the first entry per value (legacy color swatches can collapse to one). */
function dedupeByValue<T extends { value: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((it) => {
    if (seen.has(it.value)) return false;
    seen.add(it.value);
    return true;
  });
}

/**
 * Map a raw product row → the AdminProductInput shape the product form expects.
 * Shared by the Edit page and the Duplicate flow (Add form pre-filled).
 *
 * `opts.blankSku` clears the SKU — used when duplicating, since SKU is required
 * and must be unique, so the admin is forced to set a new one before saving.
 */
export function productRowToFormInput(
  row: ProductRow,
  opts?: { blankSku?: boolean },
): AdminProductInput {
  const images = row.images ?? [];
  // A variant image is only carried over if it's still one of the product's images.
  const keepImage = (url?: string) => (url && images.includes(url) ? url : "");

  return {
    name: row.name,
    description: row.description ?? "",
    priceUSD: String(row.price_usd),
    originalPriceUSD:
      row.original_price_usd != null ? String(row.original_price_usd) : "",
    categoryId: row.category_id,
    subcategory: row.subcategory ?? "",
    sku: opts?.blankSku ? "" : (row.sku ?? ""),
    badge: row.badge === "SALE" || row.badge === "HOT" ? row.badge : "",
    inStock: row.in_stock,
    hideNewBadge: row.hide_new_badge,
    // Comma-separated keywords (stored in tags) for the search-keywords field.
    searchKeywords: (row.tags ?? []).join(", "),
    // Split the stored variants jsonb back into the three editable groups.
    // Colors keep their stored name + hex EXACTLY (presets and custom colors
    // alike) — we no longer snap to the fixed palette, so custom colors survive
    // editing and duplicating. Fall back to a preset hex by name, then black,
    // only if a legacy row somehow has no valid hex.
    colors: dedupeByValue(
      (row.variants ?? [])
        .filter((v) => v.type === "color")
        .map((v) => ({
          value: v.value,
          colorHex: /^#[0-9a-fA-F]{6}$/.test(v.colorHex ?? "")
            ? (v.colorHex as string)
            : (colorHexByName(v.value) ?? "#000000"),
          image: keepImage(v.image),
        })),
    ),
    models: (row.variants ?? [])
      .filter((v) => v.type === "model")
      .map((v) => ({ value: v.value, image: keepImage(v.image) })),
    sizes: (row.variants ?? [])
      .filter((v) => v.type === "size")
      .map((v) => ({ value: v.value })),
    images,
    thumbnail: row.thumbnail ?? "",
  };
}
