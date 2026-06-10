/**
 * Category-page filtering: shared types, defaults, URL (de)serialization,
 * and the pure product filter/sort pipeline. Keeping this framework-free
 * makes the logic easy to reason about and reuse across sidebar + drawer.
 */

import type { Product } from "@/data/products";

export type SortKey =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "discount";
// TODO: add "popular" back in Phase 9 when real order/view data is available

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest",     label: "Newest First" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc",label: "Price: High to Low" },
  { key: "discount",  label: "Biggest Discount" },
];

export interface Filters {
  q: string;
  min: number | null;
  max: number | null;
  sale: boolean;
  newOnly: boolean;
  /** Selected color variant value labels, e.g. ["Coral", "Black"]. */
  colors: string[];
  inStock: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = {
  q: "",
  min: null,
  max: null,
  sale: false,
  newOnly: false,
  colors: [],
  inStock: false,
  sort: "newest",
};

export interface PricePreset {
  label: string;
  min: number | null;
  max: number | null;
}

export const PRICE_PRESETS: PricePreset[] = [
  { label: "Under $5", min: null, max: 5 },
  { label: "$5 - $15", min: 5, max: 15 },
  { label: "$15 - $30", min: 15, max: 30 },
  { label: "Over $30", min: 30, max: null },
];

/** Unique color variants present in a product set (for the color filter). */
export function collectColors(
  products: Product[],
): { value: string; colorHex: string }[] {
  const map = new Map<string, string>();
  for (const p of products) {
    for (const v of p.variants) {
      if (v.type === "color" && v.colorHex && !map.has(v.value)) {
        map.set(v.value, v.colorHex);
      }
    }
  }
  return [...map.entries()].map(([value, colorHex]) => ({ value, colorHex }));
}

/** Apply all active filters + sort. Pure — returns a new array. */
export function applyFilters(products: Product[], f: Filters): Product[] {
  const q = f.q.trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (f.min !== null && p.priceUSD < f.min) return false;
    if (f.max !== null && p.priceUSD > f.max) return false;
    if (f.sale && !(p.discountPercent || p.badge === "SALE")) return false;
    if (f.newOnly && Date.now() - new Date(p.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000) return false;
    if (f.inStock && !p.inStock) return false;
    if (f.colors.length > 0) {
      const productColors = p.variants
        .filter((v) => v.type === "color")
        .map((v) => v.value);
      if (!f.colors.some((c) => productColors.includes(c))) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (f.sort) {
    case "newest":
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    case "price-asc":
      sorted.sort((a, b) => a.priceUSD - b.priceUSD);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.priceUSD - a.priceUSD);
      break;
    case "discount":
      sorted.sort(
        (a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0),
      );
      break;
    default:
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
  }
  return sorted;
}

/** How many filters are currently active (for the mobile button badge). */
export function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.q.trim()) n++;
  if (f.min !== null || f.max !== null) n++;
  if (f.sale) n++;
  if (f.newOnly) n++;
  if (f.inStock) n++;
  return n;
}

// ── URL (de)serialization ─────────────────────────────────────────────────────

/** Read filters from URL search params, falling back to defaults. */
export function filtersFromParams(params: URLSearchParams): Filters {
  const num = (key: string): number | null => {
    const raw = params.get(key);
    if (raw === null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  const sortRaw = params.get("sort") as SortKey | null;
  const sort = SORT_OPTIONS.some((o) => o.key === sortRaw)
    ? (sortRaw as SortKey)
    : "newest";

  return {
    q: params.get("q") ?? "",
    min: num("min"),
    max: num("max"),
    sale: params.get("sale") === "1",
    newOnly: params.get("new") === "1",
    colors: params.get("colors")
      ? params.get("colors")!.split(",").filter(Boolean)
      : [],
    inStock: params.get("instock") === "1",
    sort,
  };
}

/** Serialize non-default filters into a URLSearchParams query string. */
export function filtersToQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.min !== null) p.set("min", String(f.min));
  if (f.max !== null) p.set("max", String(f.max));
  if (f.sale) p.set("sale", "1");
  if (f.newOnly) p.set("new", "1");
  if (f.colors.length > 0) p.set("colors", f.colors.join(","));
  if (f.inStock) p.set("instock", "1");
  if (f.sort !== "newest") p.set("sort", f.sort);
  return p.toString();
}
