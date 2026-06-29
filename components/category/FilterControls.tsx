"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { numberInputGuard } from "@/lib/forms/number-input";
import {
  PRICE_PRESETS,
  type Filters,
} from "@/components/category/filters";

interface FilterControlsProps {
  filters: Filters;
  patch: (p: Partial<Filters>) => void;
}

/**
 * Price inputs hold local draft state and only commit on "Apply". The parent
 * remounts this via `key` whenever the committed min/max change externally
 * (presets / Clear All), which resets the drafts without a setState-in-effect.
 */
function PriceRange({
  initialMin,
  initialMax,
  onApply,
}: {
  initialMin: number | null;
  initialMax: number | null;
  onApply: (min: number | null, max: number | null) => void;
}) {
  const [minInput, setMinInput] = useState(
    initialMin === null ? "" : String(initialMin),
  );
  const [maxInput, setMaxInput] = useState(
    initialMax === null ? "" : String(initialMax),
  );

  const apply = () => {
    const parse = (s: string): number | null => {
      const t = s.trim();
      if (t === "") return null;
      const n = Number(t);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    onApply(parse(minInput), parse(maxInput));
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={minInput}
        onChange={(e) => setMinInput(e.target.value)}
        {...numberInputGuard}
        placeholder="Min"
        aria-label="Minimum price (USD)"
        className="no-spinner w-full rounded-button border border-border bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
      />
      <span className="text-text-secondary">–</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={maxInput}
        onChange={(e) => setMaxInput(e.target.value)}
        {...numberInputGuard}
        placeholder="Max"
        aria-label="Maximum price (USD)"
        className="no-spinner w-full rounded-button border border-border bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
      />
      <button
        type="button"
        onClick={apply}
        className="shrink-0 rounded-button bg-primary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        Apply
      </button>
    </div>
  );
}

/** Collapsible section wrapper (open by default). */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="font-heading text-sm font-bold text-text-primary">
          {title}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-text-secondary transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default function FilterControls({
  filters,
  patch,
}: FilterControlsProps) {
  const presetActive = (min: number | null, max: number | null) =>
    filters.min === min && filters.max === max;

  return (
    <div>
      {/* Price Range */}
      <Section title="Price Range">
        <PriceRange
          key={`${filters.min ?? ""}-${filters.max ?? ""}`}
          initialMin={filters.min}
          initialMax={filters.max}
          onApply={(min, max) => patch({ min, max })}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => patch({ min: preset.min, max: preset.max })}
              className={cn(
                "rounded-badge border px-2.5 py-1 text-xs font-medium transition-colors",
                presetActive(preset.min, preset.max)
                  ? "border-primary bg-primary text-white"
                  : "border-border text-text-secondary hover:border-primary hover:text-primary",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Discount */}
      <Section title="Discount">
        <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={filters.sale}
            onChange={(e) => patch({ sale: e.target.checked })}
            className="h-4 w-4 accent-primary"
          />
          On Sale only
        </label>
        <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={filters.newOnly}
            onChange={(e) => patch({ newOnly: e.target.checked })}
            className="h-4 w-4 accent-primary"
          />
          New Arrivals only
        </label>
      </Section>

      {/* Availability */}
      <Section title="Availability">
        <label className="flex cursor-pointer items-center justify-between py-1 text-sm text-text-primary">
          <span>In Stock Only</span>
          <button
            type="button"
            role="switch"
            aria-checked={filters.inStock}
            onClick={() => patch({ inStock: !filters.inStock })}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              filters.inStock ? "bg-primary" : "bg-border",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                filters.inStock ? "translate-x-[22px]" : "translate-x-0.5",
              )}
            />
          </button>
        </label>
      </Section>
    </div>
  );
}
