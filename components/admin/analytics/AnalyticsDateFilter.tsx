"use client";

// Date-range filter for the analytics page. Preset buttons + an optional custom
// range, all URL-driven (?range=...&from=...&to=...) so the server page re-reads
// them and re-aggregates. The whole page respects the selected window.

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";
import {
  ANALYTICS_PRESETS,
  type AnalyticsPreset,
} from "@/lib/analytics/range";

export default function AnalyticsDateFilter({
  preset,
  from,
  to,
}: {
  preset: AnalyticsPreset;
  from: string | null;
  to: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");
  const [showCustom, setShowCustom] = useState(preset === "custom");

  const pushRange = (next: AnalyticsPreset, f?: string, t?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", next);
    if (next === "custom" && f && t) {
      params.set("from", f);
      params.set("to", t);
    } else {
      params.delete("from");
      params.delete("to");
    }
    startTransition(() => {
      router.push(`/admin/analytics?${params.toString()}`);
    });
  };

  const applyCustom = () => {
    if (customFrom && customTo) pushRange("custom", customFrom, customTo);
  };

  const customValid =
    !!customFrom && !!customTo && customFrom <= customTo;

  return (
    <div className="rounded-card border border-border bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          <CalendarRange size={15} />
          Range
        </span>
        {ANALYTICS_PRESETS.map((p) => {
          const active = preset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              disabled={isPending}
              onClick={() => {
                setShowCustom(false);
                pushRange(p.key);
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
          disabled={isPending}
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
            disabled={!customValid || isPending}
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
