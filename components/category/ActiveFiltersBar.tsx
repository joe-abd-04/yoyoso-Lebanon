"use client";

import { X } from "lucide-react";
import { formatUSD } from "@/lib/formatPrice";
import type { Filters } from "@/components/category/filters";

interface ActiveFiltersBarProps {
  filters: Filters;
  patch: (p: Partial<Filters>) => void;
  onClear: () => void;
}

interface Pill {
  key: string;
  label: string;
  remove: () => void;
}

function priceLabel(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${formatUSD(min)} – ${formatUSD(max)}`;
  if (min !== null) return `Over ${formatUSD(min)}`;
  return `Under ${formatUSD(max as number)}`;
}

export default function ActiveFiltersBar({
  filters,
  patch,
  onClear,
}: ActiveFiltersBarProps) {
  const pills: Pill[] = [];

  if (filters.q.trim()) {
    pills.push({
      key: "q",
      label: `"${filters.q.trim()}"`,
      remove: () => patch({ q: "" }),
    });
  }
  if (filters.min !== null || filters.max !== null) {
    pills.push({
      key: "price",
      label: priceLabel(filters.min, filters.max),
      remove: () => patch({ min: null, max: null }),
    });
  }
  if (filters.sale) {
    pills.push({ key: "sale", label: "On Sale", remove: () => patch({ sale: false }) });
  }
  if (filters.newOnly) {
    pills.push({
      key: "new",
      label: "New Arrivals",
      remove: () => patch({ newOnly: false }),
    });
  }
  for (const color of filters.colors) {
    pills.push({
      key: `color-${color}`,
      label: color,
      remove: () =>
        patch({ colors: filters.colors.filter((c) => c !== color) }),
    });
  }
  if (filters.inStock) {
    pills.push({
      key: "instock",
      label: "In Stock",
      remove: () => patch({ inStock: false }),
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pills.map((pill) => (
        <span
          key={pill.key}
          className="flex items-center gap-1 rounded-badge bg-primary/10 py-1 pl-3 pr-1.5 text-xs font-medium text-primary"
        >
          {pill.label}
          <button
            type="button"
            onClick={pill.remove}
            aria-label={`Remove ${pill.label} filter`}
            className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-primary/20"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="text-xs font-semibold text-text-secondary underline transition-colors hover:text-primary"
      >
        Clear All
      </button>
    </div>
  );
}
