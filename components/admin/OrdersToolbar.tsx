"use client";

// Search + status filter for the admin orders list. Drives the URL
// (?q=&status=&page=) so the server page fetches exactly one page from the DB.
// Search is debounced; changing any control resets to page 1. Mirrors
// ProductsToolbar.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersToolbar({
  search,
  status,
  sort,
}: {
  search: string;
  status: string;
  sort: string;
}) {
  const router = useRouter();
  // `search` seeds the box on mount; we don't sync from props in an effect (that
  // would be a setState-in-effect). The selects read their value straight from props.
  const [q, setQ] = useState(search);
  const firstRender = useRef(true);

  const pushParams = (next: Partial<Record<string, string>>) => {
    const params = new URLSearchParams();
    const merged = { q, status, sort, ...next };
    if (merged.q?.trim()) params.set("q", merged.q.trim());
    if (merged.status && merged.status !== "all") params.set("status", merged.status);
    if (merged.sort && merged.sort !== "newest") params.set("sort", merged.sort);
    // any change resets pagination
    const qs = params.toString();
    router.push(qs ? `/admin/orders?${qs}` : "/admin/orders");
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

  const hasFilters = Boolean(search || (status && status !== "all"));

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
          placeholder="Search by order #, name or phone…"
          maxLength={100}
          className="w-full rounded-button border border-border bg-white py-2.5 pl-9 pr-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
        />
      </div>

      {/* Status filter */}
      <select
        value={status || "all"}
        onChange={(e) => pushParams({ status: e.target.value })}
        className="rounded-button border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Date sort */}
      <select
        value={sort || "newest"}
        onChange={(e) => pushParams({ sort: e.target.value })}
        className="rounded-button border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
        aria-label="Sort by date"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.push("/admin/orders");
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
