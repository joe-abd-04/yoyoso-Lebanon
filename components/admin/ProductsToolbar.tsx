"use client";

// Search + filters for the admin product list. Drives the URL (?q=&category=&
// stock=&page=) so the server page can fetch exactly one page from the DB.
// Search is debounced; changing any control resets to page 1.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export type ToolbarCategory = { id: string; name: string };

export default function ProductsToolbar({
  categories,
  search,
  categoryId,
  stock,
}: {
  categories: ToolbarCategory[];
  search: string;
  categoryId: string;
  stock: string;
}) {
  const router = useRouter();
  // `search` seeds the box on mount; the Clear button resets it locally. We
  // deliberately don't sync it from props in an effect (that would be a
  // setState-in-effect) — the selects below read their value straight from props.
  const [q, setQ] = useState(search);
  const firstRender = useRef(true);

  const pushParams = (next: Partial<Record<string, string>>) => {
    const params = new URLSearchParams();
    const merged = { q, category: categoryId, stock, ...next };
    if (merged.q?.trim()) params.set("q", merged.q.trim());
    if (merged.category) params.set("category", merged.category);
    if (merged.stock && merged.stock !== "all") params.set("stock", merged.stock);
    // any change resets pagination
    const qs = params.toString();
    router.push(qs ? `/admin/products?${qs}` : "/admin/products");
  };

  // Debounce the search box.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (q.trim() !== search) pushParams({ q });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = Boolean(search || categoryId || (stock && stock !== "all"));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name…"
          maxLength={100}
          className="w-full rounded-button border border-border bg-white py-2.5 pl-9 pr-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
        />
      </div>

      {/* Category filter */}
      <select
        value={categoryId}
        onChange={(e) => pushParams({ category: e.target.value })}
        className="rounded-button border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Stock filter */}
      <select
        value={stock || "all"}
        onChange={(e) => pushParams({ stock: e.target.value })}
        className="rounded-button border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
        aria-label="Filter by stock status"
      >
        <option value="all">All stock</option>
        <option value="in">In stock</option>
        <option value="out">Out of stock</option>
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.push("/admin/products");
          }}
          className="flex items-center justify-center gap-1.5 rounded-button border border-border bg-white px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <X size={15} />
          Clear
        </button>
      )}
    </div>
  );
}
