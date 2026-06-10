"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/components/shared/ProductsProvider";
import ProductCard from "@/components/product/ProductCard";
import SortDropdown from "@/components/category/SortDropdown";
import { applyFilters, DEFAULT_FILTERS, type SortKey } from "@/components/category/filters";
import { createProductFuse } from "@/lib/search";

export default function SearchView() {
  const searchParams = useSearchParams();
  const products = useProducts();
  // Cap the URL-supplied query length (it is rendered + drives search).
  const query = (searchParams.get("q") ?? "").slice(0, 100);
  const [sort, setSort] = useState<SortKey>("newest");

  const fuse = useMemo(() => createProductFuse(products), [products]);
  const popular = useMemo(
    () => products.filter((p) => p.isBestSeller).slice(0, 4),
    [products],
  );

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    // Fuse.js fuzzy search — handles typos, partial words, case insensitive
    const found = fuse.search(q).map((r) => r.item);
    return applyFilters(found, { ...DEFAULT_FILTERS, sort });
  }, [query, sort, fuse]);

  const count = results.length;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
        Search
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        {count} {count === 1 ? "result" : "results"} for &quot;{query}&quot;
      </p>

      {count > 0 ? (
        <>
          <div className="mt-4 flex justify-end">
            <SortDropdown value={sort} onChange={setSort} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-8">
          <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-white py-12 text-center">
            <span className="text-4xl" aria-hidden="true">
              🔍
            </span>
            <p className="mt-3 font-heading text-lg font-bold text-text-primary">
              No results found
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Try searching for something else.
            </p>
          </div>

          {popular.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-5 font-heading text-xl font-bold text-text-primary">
                Popular Products
              </h2>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {popular.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
