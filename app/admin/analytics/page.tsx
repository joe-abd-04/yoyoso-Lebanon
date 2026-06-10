import type { Metadata } from "next";
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Boxes,
  TrendingUp,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { getAnalytics } from "@/lib/data/admin-analytics";
import { resolveRange, parsePreset } from "@/lib/analytics/range";
import { formatUSD } from "@/lib/formatPrice";
import AnalyticsDateFilter from "@/components/admin/analytics/AnalyticsDateFilter";
import TimeSeriesSection from "@/components/admin/analytics/TimeSeriesSection";
import StatusDonut from "@/components/admin/analytics/StatusDonut";
import BestSellersChart from "@/components/admin/analytics/BestSellersChart";
import CategoryRevenueChart from "@/components/admin/analytics/CategoryRevenueChart";
import RegionSales from "@/components/admin/analytics/RegionSales";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  // Next 16: searchParams is a Promise.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Self-contained gate (the layout already enforces it too).
  await requireAdmin();

  const sp = await searchParams;
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const preset = parsePreset(first(sp.range));
  const range = resolveRange(preset, first(sp.from), first(sp.to));
  const data = await getAnalytics(range);
  const t = data.totals;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
            Sales Analytics
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Showing data for{" "}
            <span className="font-semibold text-text-primary">
              {data.rangeLabel}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Date range filter */}
      <div className="mt-4">
        <AnalyticsDateFilter
          preset={range.preset}
          from={range.from}
          to={range.to}
        />
      </div>

      {/* Revenue — headline figure for the selected range */}
      <div className="mt-5 overflow-hidden rounded-card border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-white shadow-sm">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <DollarSign size={20} />
              </span>
              <p className="text-sm font-bold uppercase tracking-wide text-primary">
                Revenue
              </p>
            </div>
            <p className="mt-3 font-heading text-4xl font-extrabold leading-none tracking-tight text-text-primary sm:text-5xl">
              {formatUSD(t.revenue)}
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              Selected range · excludes cancelled
            </p>
          </div>
          <span className="hidden shrink-0 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-text-secondary shadow-sm sm:inline-block">
            {data.rangeLabel}
          </span>
        </div>
      </div>

      {/* Supporting totals */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<ShoppingCart size={20} />}
          label="Total orders"
          value={t.orders}
        />
        <StatCard
          icon={<Receipt size={20} />}
          label="Average order value"
          value={formatUSD(t.avgOrderValue)}
        />
        <StatCard
          icon={<Boxes size={20} />}
          label="Products sold"
          value={t.productsSold}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Orders this month"
          value={t.ordersThisMonth}
        />
      </div>

      {!data.hasData ? (
        <div className="mt-6 rounded-card border border-border bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-text-secondary">
            No orders found for {data.rangeLabel.toLowerCase()}. Try a wider date
            range.
          </p>
        </div>
      ) : (
        <>
          {/* Time series (revenue + orders, with granularity toggle) */}
          <div className="mt-6">
            <TimeSeriesSection series={data.timeSeries} />
          </div>

          {/* Status + best sellers */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <StatusDonut data={data.statusBreakdown} />
            <BestSellersChart data={data.bestSellers} />
          </div>

          {/* Category + region */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CategoryRevenueChart data={data.categoryRevenue} />
            <RegionSales regions={data.regionSales} cities={data.citySales} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Stat card (server) ────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-white p-4 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-text-secondary">
          {label}
        </p>
        <p className="font-heading text-lg font-extrabold text-text-primary sm:text-xl">
          {value}
        </p>
      </div>
    </div>
  );
}
