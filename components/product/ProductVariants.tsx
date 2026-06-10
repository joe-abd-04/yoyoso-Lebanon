"use client";

import type { ProductVariant } from "@/data/products";
import { cn } from "@/lib/utils";

interface ProductVariantsProps {
  colors: ProductVariant[];
  models: ProductVariant[];
  sizes: ProductVariant[];
  selectedColor: string | null;
  selectedModel: string | null;
  selectedSize: string | null;
  onColorChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onSizeChange: (value: string) => void;
}

/** Shared pill button used by the Model and Size selectors. */
function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-w-[44px] rounded-button border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-white"
          : "border-border text-text-primary hover:border-primary",
      )}
    >
      {label}
    </button>
  );
}

export default function ProductVariants({
  colors,
  models,
  sizes,
  selectedColor,
  selectedModel,
  selectedSize,
  onColorChange,
  onModelChange,
  onSizeChange,
}: ProductVariantsProps) {
  return (
    <div className="space-y-5">
      {/* Color — clickable chips: a small color dot + the color name */}
      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-text-primary">
            Color:{" "}
            <span className="font-normal text-text-secondary">
              {selectedColor ?? "Select a color"}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            {colors.map((c) => {
              const active = selectedColor === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onColorChange(c.value)}
                  aria-label={c.value}
                  aria-pressed={active}
                  title={c.value}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary text-primary ring-2 ring-primary ring-offset-1"
                      : "border-border text-text-primary hover:border-primary",
                  )}
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: c.colorHex }}
                  />
                  {c.value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Model — clickable pills */}
      {models.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-text-primary">
            Model:{" "}
            <span className="font-normal text-text-secondary">
              {selectedModel ?? "Select a model"}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {models.map((m) => (
              <Pill
                key={m.value}
                label={m.value}
                active={selectedModel === m.value}
                onClick={() => onModelChange(m.value)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size — clickable pills */}
      {sizes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-text-primary">
            Size:{" "}
            <span className="font-normal text-text-secondary">
              {selectedSize ?? "Select a size"}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <Pill
                key={s.value}
                label={s.value}
                active={selectedSize === s.value}
                onClick={() => onSizeChange(s.value)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
