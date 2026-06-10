// SERVER-ONLY data access for the ADMIN product screens.
// Uses the service-role server client, so import ONLY from Server Components /
// Server Actions inside /admin (which are gated by requireAdmin()).
//
// Unlike lib/data/products.ts (which loads the whole catalog for the storefront),
// this paginates at the database level with .range() + an exact count, so it
// scales to a large catalog (e.g. 2000 products) without ever loading them all.

import { createServerClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/products/placeholder";
import type { Product as ProductRow } from "@/lib/supabase/types";

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
