"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { numberInputGuard } from "@/lib/forms/number-input";

const MIN = 1;
const MAX = 99;

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export default function QuantitySelector({
  value,
  onChange,
}: QuantitySelectorProps) {
  const clamp = (n: number) => Math.max(MIN, Math.min(MAX, n));
  const atMin = value <= MIN;
  const atMax = value >= MAX;

  return (
    <div className="inline-flex h-10 items-center overflow-hidden rounded-button border border-border">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={atMin}
        aria-label="Decrease quantity"
        className={cn(
          "flex h-full w-10 items-center justify-center transition-colors",
          atMin
            ? "cursor-not-allowed text-border"
            : "text-text-primary hover:bg-surface",
        )}
      >
        <Minus size={16} />
      </button>

      <input
        type="number"
        inputMode="numeric"
        min={MIN}
        max={MAX}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) && n >= MIN ? clamp(n) : MIN);
        }}
        {...numberInputGuard}
        aria-label="Quantity"
        className="h-full w-12 [appearance:textfield] border-x border-border text-center text-sm font-semibold text-text-primary focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={atMax}
        aria-label="Increase quantity"
        className={cn(
          "flex h-full w-10 items-center justify-center transition-colors",
          atMax
            ? "cursor-not-allowed text-border"
            : "text-text-primary hover:bg-surface",
        )}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
