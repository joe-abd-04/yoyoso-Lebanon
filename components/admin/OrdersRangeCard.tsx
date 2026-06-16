"use client";

// Dashboard "Orders" card with a date-range filter. Replaces the old fixed
// "Orders today / this month / total" cards. Shows the order COUNT and REVENUE
// (excl. cancelled) for the selected range. Uses the shared <DateRangeControl>
// (same UX as the analytics page) and an admin-verified server action to fetch
// the scoped figures — order rows never reach the client.

import { useState, useTransition } from "react";
import { ClipboardList, DollarSign, Loader2 } from "lucide-react";
import DateRangeControl from "@/components/admin/DateRangeControl";
import { DASHBOARD_ORDER_PRESETS } from "@/lib/analytics/range";
import { getOrdersRangeStats } from "@/app/admin/dashboard-actions";
import { formatUSD } from "@/lib/formatPrice";
import { useUIStore } from "@/store/uiStore";

export interface OrdersRangeInitial {
  preset: string;
  count: number;
  revenue: number;
  label: string;
}

export default function OrdersRangeCard({
  initial,
}: {
  initial: OrdersRangeInitial;
}) {
  const showToast = useUIStore((s) => s.showToast);
  const [preset, setPreset] = useState(initial.preset);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [stats, setStats] = useState({
    count: initial.count,
    revenue: initial.revenue,
    label: initial.label,
  });
  const [isPending, startTransition] = useTransition();

  const select = (next: string, f?: string, t?: string) => {
    setPreset(next);
    setFrom(f ?? null);
    setTo(t ?? null);
    startTransition(async () => {
      const res = await getOrdersRangeStats({
        preset: next,
        from: f ?? null,
        to: t ?? null,
      });
      if (res.ok) {
        setStats({ count: res.count, revenue: res.revenue, label: res.label });
      } else {
        showToast(res.error, "error");
      }
    });
  };

  return (
    <section className="rounded-card border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-lg font-bold text-text-primary">
          Orders
        </h2>
        <DateRangeControl
          presets={DASHBOARD_ORDER_PRESETS}
          preset={preset}
          from={from}
          to={to}
          onSelect={select}
          disabled={isPending}
        />
      </div>

      <p className="mt-3 text-xs font-medium text-text-secondary">
        Showing <span className="font-semibold text-text-primary">{stats.label}</span>
      </p>

      <div
        className={`mt-3 grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 ${
          isPending ? "opacity-50" : ""
        }`}
      >
        {/* Order count */}
        <div className="flex items-center gap-3 rounded-card border border-border bg-surface/40 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <ClipboardList size={20} />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-text-secondary">
              Orders
            </p>
            <p className="font-heading text-xl font-extrabold text-text-primary sm:text-2xl">
              {stats.count}
            </p>
          </div>
        </div>

        {/* Revenue */}
        <div className="flex items-center gap-3 rounded-card border border-border bg-surface/40 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
            {isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <DollarSign size={20} />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-text-secondary">
              Revenue
            </p>
            <p className="font-heading text-xl font-extrabold text-text-primary sm:text-2xl">
              {formatUSD(stats.revenue)}
            </p>
            <p className="text-[11px] text-text-secondary">Excludes cancelled</p>
          </div>
        </div>
      </div>
    </section>
  );
}
