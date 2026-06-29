"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import type { Product } from "@/data/products";
import {
  useCategories,
  useCategoryBySlug,
} from "@/components/shared/CategoriesProvider";
import { useProducts } from "@/components/shared/ProductsProvider";
import { useUIStore } from "@/store/uiStore";
import CategorySidebar from "@/components/category/CategorySidebar";
import SortDropdown from "@/components/category/SortDropdown";
import ActiveFiltersBar from "@/components/category/ActiveFiltersBar";
import FilterDrawer from "@/components/category/FilterDrawer";
import ProductGrid from "@/components/category/ProductGrid";
import {
  applyFilters,
  countActiveFilters,
  filtersFromParams,
  filtersToQuery,
  DEFAULT_FILTERS,
  type Filters,
} from "@/components/category/filters";

/** Resolve the base product set for a slug, including virtual collections. */
function resolveBase(slug: string, allProducts: Product[]): Product[] {
  if (slug === "on-sale" || slug === "sale") {
    return allProducts.filter((p) => p.discountPercent || p.badge === "SALE");
  }
  if (slug === "best-sellers") {
    return allProducts.filter((p) => p.isBestSeller);
  }
  if (slug === "new-arrivals") {
    // All products sorted newest first — date-driven, no manual flag needed.
    return [...allProducts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  return allProducts.filter((p) => p.categories.includes(slug));
}

interface CategoryViewProps {
  slug: string;
  categoryName: string;
}

export default function CategoryView({ slug, categoryName }: CategoryViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categories = useCategories();
  const allProducts = useProducts();
  const cat = useCategoryBySlug(slug);

  const filterDrawerOpen = useUIStore((s) => s.filterDrawerOpen);
  const setFilterDrawerOpen = useUIStore((s) => s.setFilterDrawerOpen);

  const [filters, setFilters] = useState<Filters>(() =>
    filtersFromParams(new URLSearchParams(searchParams.toString())),
  );

  // Brief skeleton on mount.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  // `sub` drives subcategory filtering — read from URL, not from filter state.
  const sub = searchParams.get("sub") ?? "";

  // Look up the active subcategory object so we can filter by its name.
  const subInfo = useMemo(
    () =>
      sub && cat
        ? (cat.subcategories.find((s) => s.slug === sub) ?? null)
        : null,
    [sub, cat],
  );

  // Stable ref so the URL-sync effect doesn't need `sub` as a dep (avoids
  // replacing the URL on every sub change causing a render loop). The ref is
  // updated in an effect (not during render) so it stays lint-clean; this
  // effect runs before the URL-sync effect below, so it sees the latest value.
  const subRef = useRef(sub);
  useEffect(() => {
    subRef.current = sub;
  }, [sub]);

  // Keep the URL in sync for shareability (skip the first render).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const qs = filtersToQuery(filters);
    const currentSub = subRef.current;
    const parts = [currentSub ? `sub=${currentSub}` : "", qs]
      .filter(Boolean)
      .join("&");
    router.replace(parts ? `${pathname}?${parts}` : pathname, {
      scroll: false,
    });
  }, [filters, pathname, router]);

  const patch = (p: Partial<Filters>) =>
    setFilters((prev) => ({ ...prev, ...p }));
  const clearAll = () =>
    setFilters((prev) => ({ ...DEFAULT_FILTERS, sort: prev.sort }));

  // Base set: category products, optionally narrowed to the active subcategory.
  const base = useMemo(() => {
    const categoryProducts = resolveBase(slug, allProducts);
    if (!subInfo) return categoryProducts;
    // Products store subcategory as the human name (e.g. "Skin Care"), while
    // the URL uses the slug (e.g. "skin-care"). Match via subInfo.name.
    return categoryProducts.filter((p) => p.subcategory === subInfo.name);
  }, [slug, subInfo, allProducts]);

  const filtered = useMemo(() => applyFilters(base, filters), [base, filters]);

  // Per-category counts for the sidebar nav.
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of categories) {
      map[c.slug] = allProducts.filter((p) => p.categories.includes(c.slug)).length;
    }
    return map;
  }, [categories, allProducts]);

  const activeCount = countActiveFilters(filters);
  const resultCount = filtered.length;
  const displayName = subInfo ? subInfo.name : categoryName;

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-text-secondary">
          <li>
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight size={14} />
          </li>
          {subInfo ? (
            <>
              <li>
                <Link
                  href={`/category/${slug}`}
                  className="transition-colors hover:text-primary"
                >
                  {categoryName}
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight size={14} />
              </li>
              <li className="font-medium text-text-primary">{subInfo.name}</li>
            </>
          ) : (
            <li className="font-medium text-text-primary">{categoryName}</li>
          )}
        </ol>
      </nav>

      {/* Page title */}
      <h1 className="mt-3 font-heading text-2xl font-bold text-text-primary sm:text-3xl">
        {displayName}
      </h1>

      {/* Live result count */}
      <p className="mt-4 text-sm text-text-secondary">
        {filters.q.trim()
          ? `${resultCount} ${resultCount === 1 ? "result" : "results"} for "${filters.q.trim()}"`
          : `${resultCount} ${resultCount === 1 ? "product" : "products"} found`}
      </p>

      {/* Search within category */}
      <div className="relative mt-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <input
          type="search"
          value={filters.q}
          onChange={(e) => patch({ q: e.target.value })}
          placeholder="Search within this category..."
          aria-label="Search products"
          className="w-full rounded-button border border-border bg-white py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Toolbar: sort (desktop) */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="hidden lg:block">
          <ActiveFiltersBar filters={filters} patch={patch} onClear={clearAll} />
        </div>
        <div className="ml-auto hidden lg:block">
          <SortDropdown
            value={filters.sort}
            onChange={(sort) => patch({ sort })}
          />
        </div>
      </div>

      {/* Body: sidebar + grid */}
      <div className="mt-6 gap-8 lg:flex">
        <div className="hidden lg:block">
          <CategorySidebar
            activeSlug={slug}
            activeSub={sub}
            counts={counts}
            filters={filters}
            patch={patch}
            onClear={clearAll}
          />
        </div>

        <div className="min-w-0 flex-1">
          <ProductGrid
            products={filtered}
            loading={loading}
            onClear={clearAll}
          />
        </div>
      </div>

      {/* Mobile sticky Filter & Sort button */}
      <button
        type="button"
        onClick={() => setFilterDrawerOpen(true)}
        className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg lg:hidden"
      >
        <SlidersHorizontal size={17} />
        Filter &amp; Sort
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-primary">
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobile drawer */}
      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        patch={patch}
        resultCount={resultCount}
        onClear={clearAll}
      />
    </>
  );
}
