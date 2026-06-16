"use client";

// Shared, presentational date-range control: preset buttons + an optional
// custom (from/to) range. URL-agnostic — it just calls onSelect(preset, from?,
// to?). Reused by the analytics page filter (URL-driven) and the dashboard
// "Orders" card (state + server-action driven) so the UX stays identical.

import { useState } from "react";
import { CalendarRange } from "lucide-react";

export interface RangePreset {
  key: string;
  label: string;
}

export default function DateRangeControl({
  presets,
  preset,
  from,
  to,
  onSelect,
  disabled = false,
}: {
  presets: RangePreset[];
  preset: string;
  from: string | null;
  to: string | null;
  onSelect: (preset: string, from?: string, to?: string) => void;
  disabled?: boolean;
}) {
  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");
  const [showCustom, setShowCustom] = useState(preset === "custom");

  const customValid = !!customFrom && !!customTo && customFrom <= customTo;
  const applyCustom = () => {
    if (customValid) onSelect("custom", customFrom, customTo);
  };

  return (
    <div className="rounded-card border border-border bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          <CalendarRange size={15} />
          Range
        </span>
        {presets.map((p) => {
          const active = preset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              disabled={disabled}
              onClick={() => {
                setShowCustom(false);
                onSelect(p.key);
              }}
              className={`rounded-button px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                active
                  ? "bg-primary text-white"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowCustom((v) => !v)}
          className={`rounded-button px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
            preset === "custom"
              ? "bg-primary text-white"
              : "bg-surface text-text-secondary hover:text-text-primary"
          }`}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-border pt-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-text-secondary">
            From
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-button border border-border bg-white px-2.5 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-text-secondary">
            To
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-button border border-border bg-white px-2.5 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none"
            />
          </label>
          <button
            type="button"
            disabled={!customValid || disabled}
            onClick={applyCustom}
            className="rounded-button bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
