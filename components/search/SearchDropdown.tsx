"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Clock, ArrowRight } from "lucide-react";
import { useCategories } from "@/components/shared/CategoriesProvider";
import { useProducts } from "@/components/shared/ProductsProvider";
import { formatUSD } from "@/lib/formatPrice";
import { createProductFuse } from "@/lib/search";
import { cn } from "@/lib/utils";

// ── Recent searches ───────────────────────────────────────────────────────────

const RECENT_KEY = "yys-recent-searches";
const MAX_RECENT = 5;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function persistSearch(q: string): void {
  if (typeof window === "undefined") return;
  const prev = loadRecent();
  const next = [q, ...prev.filter((s) => s !== q)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function clearRecentStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENT_KEY);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SearchDropdownProps {
  /** Called after navigating so the mobile menu can close. */
  onNavigate?: () => void;
  className?: string;
}

export default function SearchDropdown({
  onNavigate,
  className,
}: SearchDropdownProps) {
  const router = useRouter();
  const categories = useCategories();
  const products = useProducts();
  const fuse = useMemo(() => createProductFuse(products), [products]);

  // `query` updates immediately (drives input value + panel visibility).
  // `debouncedQuery` lags 150ms (drives Fuse.js search).
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  // Lazy-init from localStorage so there's no setState-in-effect
  const [recent, setRecent] = useState<string[]>(() => loadRecent());

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIdx(-1);
    clearTimeout(debounceRef.current);
    // setState called inside a timer callback (not directly in effect body)
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 150);
  };

  const handleFocus = () => {
    setRecent(loadRecent()); // refresh on focus
    setOpen(true);
    setActiveIdx(-1);
  };

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
    router.push(href);
    onNavigate?.();
  };

  const submitSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    persistSearch(trimmed);
    setRecent(loadRecent());
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIdx >= 0) return; // keyboard selection handled by onKeyDown
    submitSearch(query);
  };

  const clearRecentAndUpdate = () => {
    clearRecentStorage();
    setRecent([]);
  };

  // ── Search results (Fuse.js) ──────────────────────────────────────────────

  const results = useMemo(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) return [];
    return fuse.search(q).slice(0, 6).map((r) => r.item);
  }, [debouncedQuery, fuse]);

  // ── Dropdown state logic ──────────────────────────────────────────────────

  const trimmedQuery = query.trim();
  const showResults = open && trimmedQuery.length >= 2;
  const showRecent = open && trimmedQuery.length === 0 && recent.length > 0;
  const isVisible = showResults || showRecent;

  // Total keyboard-navigable items
  const totalItems = showResults
    ? results.length + 1 // +1 for "See all results" row
    : showRecent
      ? recent.length
      : 0;

  // ── Keyboard navigation ───────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, totalItems - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx === -1) {
        submitSearch(query);
        return;
      }
      if (showResults) {
        if (activeIdx < results.length) {
          navigate(`/product/${results[activeIdx].slug}`);
        } else {
          // "See all results" row
          submitSearch(query);
        }
      } else if (showRecent) {
        submitSearch(recent[activeIdx]);
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Search products..."
            autoComplete="off"
            maxLength={100}
            aria-label="Search products"
            aria-expanded={isVisible}
            aria-haspopup="listbox"
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
          />
        </div>
      </form>

      {/* Dropdown */}
      {isVisible && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-[200] mt-1.5 overflow-hidden rounded-card border border-border bg-white shadow-xl"
        >
          {/* ── Results state ── */}
          {showResults && (
            <>
              {results.length > 0 ? (
                <ul>
                  {results.map((product, i) => {
                    const catName =
                      categories.find((c) => c.slug === product.category)
                        ?.name ?? product.category;
                    const isActive = activeIdx === i;
                    return (
                      <li key={product.id} role="option" aria-selected={isActive}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/product/${product.slug}`)
                          }
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            isActive ? "bg-surface" : "hover:bg-surface",
                          )}
                        >
                          {/* Thumbnail */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.thumbnail}
                            alt=""
                            aria-hidden="true"
                            className="h-10 w-10 shrink-0 rounded-button object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-text-primary">
                              {product.name}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {catName}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-primary">
                            {formatUSD(product.priceUSD)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                // No results (debouncedQuery has caught up)
                debouncedQuery.trim().length >= 2 && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-text-secondary">
                      No products found for{" "}
                      <span className="font-medium text-text-primary">
                        &ldquo;{debouncedQuery.trim()}&rdquo;
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Try different keywords or check your spelling
                    </p>
                  </div>
                )
              )}

              {/* "See all results" row */}
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => submitSearch(query)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3 text-sm font-semibold transition-colors",
                    activeIdx === results.length
                      ? "bg-primary/5 text-primary"
                      : "text-primary hover:bg-primary/5",
                  )}
                  role="option"
                  aria-selected={activeIdx === results.length}
                >
                  <span>
                    See all results for{" "}
                    <span className="italic">
                      &ldquo;{trimmedQuery}&rdquo;
                    </span>
                  </span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </>
          )}

          {/* ── Recent searches state ── */}
          {showRecent && (
            <>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Recent Searches
                </span>
                <button
                  type="button"
                  onClick={clearRecentAndUpdate}
                  className="text-xs text-text-secondary transition-colors hover:text-primary"
                >
                  Clear
                </button>
              </div>
              <ul>
                {recent.map((s, i) => (
                  <li key={s} role="option" aria-selected={activeIdx === i}>
                    <button
                      type="button"
                      onClick={() => submitSearch(s)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                        activeIdx === i
                          ? "bg-surface text-text-primary"
                          : "text-text-secondary hover:bg-surface hover:text-text-primary",
                      )}
                    >
                      <Clock
                        size={14}
                        className="shrink-0 text-text-secondary"
                      />
                      <span className="truncate">{s}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
