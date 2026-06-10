"use client";

// Shared bits for the admin analytics charts: the teal YOYOSO palette, a card
// wrapper, an empty-state, and small custom tooltips. Kept in one place so every
// chart looks consistent. All recharts usage lives in client components.

import type { ReactNode } from "react";
import { formatUSD } from "@/lib/formatPrice";

// Brand teal + supporting hues (mirrors the CSS tokens in app/globals.css).
export const TEAL = "#2BC4B6";
export const TEAL_DARK = "#1BA89B";
export const ACCENT = "#FF7A6B";
export const AXIS = "#6B7878"; // text-secondary
export const GRID = "#E8EDED"; // border

// Status colors, matching the pill styles in lib/orders/status.ts.
export const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  out_for_delivery: "#6366f1",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};

// A categorical teal-leaning palette for category / region bars and pie slices.
export const CHART_PALETTE = [
  "#2BC4B6",
  "#1BA89B",
  "#5AD1C6",
  "#0F8C81",
  "#86DDD4",
  "#FF7A6B",
  "#F59E0B",
  "#3B82F6",
  "#A78BFA",
  "#64748B",
  "#14B8A6",
  "#EC4899",
];

export function chartColor(i: number): string {
  return CHART_PALETTE[i % CHART_PALETTE.length];
}

/** Card shell with a title and optional subtitle; renders an empty state when `empty`. */
export function ChartCard({
  title,
  subtitle,
  empty,
  emptyLabel = "No data for this range yet.",
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  empty?: boolean;
  emptyLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-card border border-border bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-1">
        <h2 className="font-heading text-lg font-bold text-text-primary">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
        )}
      </div>
      {empty ? (
        <div className="flex h-48 items-center justify-center text-sm text-text-secondary">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-3">{children}</div>
      )}
    </div>
  );
}

type TooltipPayload = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
};

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
}

function TooltipShell({
  label,
  rows,
}: {
  label?: string | number;
  rows: { color?: string; text: string }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-md">
      {label !== undefined && label !== "" && (
        <p className="mb-1 font-semibold text-text-primary">{label}</p>
      )}
      {rows.map((r, i) => (
        <p key={i} className="flex items-center gap-1.5 text-text-secondary">
          {r.color && (
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: r.color }}
            />
          )}
          {r.text}
        </p>
      ))}
    </div>
  );
}

/** Tooltip that renders each series value as USD. */
export function MoneyTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <TooltipShell
      label={label}
      rows={payload.map((p) => ({
        color: p.color,
        text: `${p.name ?? "Revenue"}: ${formatUSD(Number(p.value) || 0)}`,
      }))}
    />
  );
}

/** Tooltip that renders each series value as a plain count. */
export function CountTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <TooltipShell
      label={label}
      rows={payload.map((p) => ({
        color: p.color,
        text: `${p.name ?? "Orders"}: ${Number(p.value) || 0}`,
      }))}
    />
  );
}
