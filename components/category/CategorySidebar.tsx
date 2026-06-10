"use client";

import Link from "next/link";
import {
  useCategories,
  useCategoryBySlug,
} from "@/components/shared/CategoriesProvider";
import { cn } from "@/lib/utils";
import FilterControls from "@/components/category/FilterControls";
import type { Filters } from "@/components/category/filters";

interface CategorySidebarProps {
  activeSlug: string;
  /** Active subcategory slug from the URL ?sub= param. */
  activeSub?: string;
  counts: Record<string, number>;
  filters: Filters;
  patch: (p: Partial<Filters>) => void;
  onClear: () => void;
}

export default function CategorySidebar({
  activeSlug,
  activeSub,
  counts,
  filters,
  patch,
  onClear,
}: CategorySidebarProps) {
  const categories = useCategories();
  const currentCat = useCategoryBySlug(activeSlug);
  const hasSubs = (currentCat?.subcategories.length ?? 0) > 0;

  return (
    <aside className="w-[260px] shrink-0">
      {/* Subcategory filter — shown when the active category has subcategories */}
      {hasSubs && currentCat && (
        <div className="border-b border-border pb-4 pt-2">
          <p className="mb-2 font-heading text-sm font-bold text-text-primary">
            {currentCat.name}
          </p>
          <ul className="space-y-0.5">
            <li>
              <Link
                href={`/category/${currentCat.slug}`}
                className={cn(
                  "flex items-center rounded-button px-2 py-1.5 text-sm transition-colors",
                  !activeSub
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-text-secondary hover:bg-surface hover:text-primary",
                )}
              >
                All {currentCat.name}
              </Link>
            </li>
            {currentCat.subcategories.map((sub) => (
              <li key={sub.slug}>
                <Link
                  href={`/category/${currentCat.slug}?sub=${sub.slug}`}
                  className={cn(
                    "flex items-center rounded-button px-2 py-1.5 text-sm transition-colors",
                    activeSub === sub.slug
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-text-secondary hover:bg-surface hover:text-primary",
                  )}
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All categories nav */}
      <div className="border-b border-border py-4">
        <p className="mb-3 font-heading text-sm font-bold text-text-primary">
          Categories
        </p>
        <ul className="space-y-0.5">
          {categories.map((cat) => {
            const active = cat.slug === activeSlug;
            return (
              <li key={cat.slug}>
                <Link
                  href={`/category/${cat.slug}`}
                  className={cn(
                    "flex items-center justify-between rounded-button px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-text-secondary hover:bg-surface hover:text-primary",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">{cat.icon}</span>
                    {cat.name}
                  </span>
                  <span className="text-xs text-text-secondary">
                    ({counts[cat.slug] ?? 0})
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Filter controls */}
      <FilterControls filters={filters} patch={patch} />

      {/* Clear all */}
      <button
        type="button"
        onClick={onClear}
        className="mt-4 w-full rounded-button bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
      >
        Clear All Filters
      </button>
    </aside>
  );
}
