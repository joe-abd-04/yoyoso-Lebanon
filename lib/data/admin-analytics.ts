// SERVER-ONLY data access for the admin Sales Analytics page.
// Uses the service-role server client — import ONLY from Server Components inside
// /admin (gated by requireAdmin()). The secret key bypasses RLS, so this never
// runs in the browser.
//
// Strategy: scope a single orders query to the selected date range, then
// aggregate every figure (totals, time-series, status breakdown, best sellers,
// revenue by category, sales by region/city) in one pass in memory. At this
// store's scale (hundreds → low thousands of orders) that's cheap and far
// simpler than a pile of SQL aggregates; if volume ever explodes, move the
// heavy aggregates into a Postgres view / RPC.
//
// Category attribution: order items don't store a category, so we load a tiny
// id/slug → category map from the products + categories tables (≈40 + ≈42 rows)
// once and resolve each item to its TOP-LEVEL category. Cheap and avoids an N+1.

import { createServerClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/lib/supabase/types";
import { orderStatusLabel } from "@/lib/orders/status";
import { resolveRange, type ResolvedRange } from "@/lib/analytics/range";

// ─── Public result types ─────────────────────────────────────────────────────

export interface AnalyticsPoint {
  /** X-axis label, e.g. "Jun 8", "Jun 2", "Jun 2026". */
  label: string;
  revenue: number; // non-cancelled revenue in the bucket
  orders: number; // count of all orders placed in the bucket
}

export interface AnalyticsTimeSeries {
  day: AnalyticsPoint[];
  week: AnalyticsPoint[];
  month: AnalyticsPoint[];
}

export type Granularity = keyof AnalyticsTimeSeries;

export interface StatusSlice {
  status: string;
  label: string;
  count: number;
}

export interface BestSeller {
  slug: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface CategoryRevenue {
  name: string;
  revenue: number;
  quantity: number;
}

export interface RegionSales {
  region: string;
  orders: number;
  revenue: number;
}

export interface CitySales {
  city: string;
  region: string;
  orders: number;
  revenue: number;
}

export interface AnalyticsTotals {
  revenue: number; // selected range, excludes cancelled
  orders: number; // selected range, all statuses
  avgOrderValue: number; // revenue / non-cancelled order count
  productsSold: number; // selected range, excludes cancelled
  revenueThisMonth: number; // current calendar month, excludes cancelled
  ordersThisMonth: number; // current calendar month, all statuses
}

export interface AnalyticsData {
  rangeLabel: string;
  hasData: boolean; // any orders in the selected range
  totals: AnalyticsTotals;
  timeSeries: AnalyticsTimeSeries;
  statusBreakdown: StatusSlice[];
  bestSellers: BestSeller[];
  categoryRevenue: CategoryRevenue[];
  regionSales: RegionSales[];
  citySales: CitySales[];
}

const EMPTY_TOTALS: AnalyticsTotals = {
  revenue: 0,
  orders: 0,
  avgOrderValue: 0,
  productsSold: 0,
  revenueThisMonth: 0,
  ordersThisMonth: 0,
};

function emptyData(rangeLabel: string): AnalyticsData {
  return {
    rangeLabel,
    hasData: false,
    totals: { ...EMPTY_TOTALS },
    timeSeries: { day: [], week: [], month: [] },
    statusBreakdown: [],
    bestSellers: [],
    categoryRevenue: [],
    regionSales: [],
    citySales: [],
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Time bucketing ──────────────────────────────────────────────────────────

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local YYYY-MM-DD key for a date. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Monday (local) that starts the ISO-ish week containing d, as a Date. */
function weekStart(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (s.getDay() + 6) % 7; // 0 = Monday
  s.setDate(s.getDate() - dow);
  return s;
}

function dayLabel(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function monthLabel(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

interface Bucket {
  revenue: number;
  orders: number;
}

// Hard caps so a sparse "all time" range spanning years can never emit an absurd
// number of points. If filling the gaps would exceed the cap, we fall back to
// only the buckets that actually have data (sorted), which the categorical X
// axis renders fine.
const MAX_POINTS = 366;

interface SeriesInput {
  /** ms timestamp of the order */
  ms: number;
  revenue: number; // non-cancelled revenue (0 for cancelled)
}

/**
 * Build day/week/month series from in-range orders, filling empty buckets
 * between the effective start and end so the time axis is continuous.
 */
function buildTimeSeries(
  orders: SeriesInput[],
  range: ResolvedRange,
): AnalyticsTimeSeries {
  if (orders.length === 0) return { day: [], week: [], month: [] };

  let minMs = Infinity;
  let maxMs = -Infinity;
  for (const o of orders) {
    if (o.ms < minMs) minMs = o.ms;
    if (o.ms > maxMs) maxMs = o.ms;
  }

  // Prefer the explicit range bounds (so e.g. "last 30 days" shows the whole
  // window even where there were no orders); fall back to the data extent.
  const startMs = range.startMs ?? minMs;
  const endMs = Math.max(range.endMs, maxMs);

  const day = bucketBy(
    orders,
    (d) => dayKey(d),
    range,
    new Date(startMs),
    new Date(endMs),
    "day",
  );
  const week = bucketBy(
    orders,
    (d) => dayKey(weekStart(d)),
    range,
    new Date(startMs),
    new Date(endMs),
    "week",
  );
  const month = bucketBy(
    orders,
    (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
    range,
    new Date(startMs),
    new Date(endMs),
    "month",
  );

  return { day, week, month };
}

function bucketBy(
  orders: SeriesInput[],
  keyOf: (d: Date) => string,
  _range: ResolvedRange,
  start: Date,
  end: Date,
  granularity: Granularity,
): AnalyticsPoint[] {
  const buckets = new Map<string, Bucket>();
  const labelOf = new Map<string, string>();

  for (const o of orders) {
    const d = new Date(o.ms);
    const key = keyOf(d);
    const b = buckets.get(key) ?? { revenue: 0, orders: 0 };
    b.revenue += o.revenue;
    b.orders += 1;
    buckets.set(key, b);
    if (!labelOf.has(key)) labelOf.set(key, labelForKey(d, granularity));
  }

  // Try to fill gaps for a continuous axis, but bail to present-only if the
  // span is too wide (keeps point count bounded).
  const filledKeys = enumerateKeys(start, end, keyOf, granularity);
  const useFill = filledKeys && filledKeys.length <= MAX_POINTS;

  const orderedKeys = useFill
    ? filledKeys!
    : [...buckets.keys()].sort();

  return orderedKeys.map((key) => {
    const b = buckets.get(key);
    return {
      label: labelOf.get(key) ?? labelFromKey(key, granularity),
      revenue: round2(b?.revenue ?? 0),
      orders: b?.orders ?? 0,
    };
  });
}

function labelForKey(d: Date, granularity: Granularity): string {
  if (granularity === "month") return monthLabel(d);
  if (granularity === "week") return dayLabel(weekStart(d));
  return dayLabel(d);
}

/** Reconstruct a label from a bucket key (used only on the present-only path). */
function labelFromKey(key: string, granularity: Granularity): string {
  const parts = key.split("-").map(Number);
  if (granularity === "month") {
    return `${MONTHS[(parts[1] ?? 1) - 1]} ${parts[0]}`;
  }
  const d = new Date(parts[0], (parts[1] ?? 1) - 1, parts[2] ?? 1);
  return dayLabel(d);
}

/** Enumerate every bucket key from start..end for the granularity (or null if too many). */
function enumerateKeys(
  start: Date,
  end: Date,
  keyOf: (d: Date) => string,
  granularity: Granularity,
): string[] | null {
  const keys: string[] = [];
  const cursor =
    granularity === "month"
      ? new Date(start.getFullYear(), start.getMonth(), 1)
      : granularity === "week"
        ? weekStart(start)
        : new Date(start.getFullYear(), start.getMonth(), start.getDate());

  let guard = 0;
  while (cursor.getTime() <= end.getTime()) {
    keys.push(keyOf(cursor));
    if (granularity === "month") cursor.setMonth(cursor.getMonth() + 1);
    else if (granularity === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
    if (++guard > MAX_POINTS + 1) return null; // too wide to fill
  }
  return keys;
}

// ─── Category map ────────────────────────────────────────────────────────────

/** Build product → top-level category-name resolvers from a couple of small reads. */
async function loadCategoryResolver(
  supabase: ReturnType<typeof createServerClient>,
): Promise<(item: OrderItem) => string> {
  const [{ data: cats }, { data: prods }] = await Promise.all([
    supabase.from("categories").select("id,name,parent_id"),
    supabase.from("products").select("id,slug,category_id"),
  ]);

  // category id → top-level category name
  const nameById = new Map<string, string>();
  const parentById = new Map<string, string | null>();
  for (const c of cats ?? []) {
    nameById.set(c.id, c.name);
    parentById.set(c.id, c.parent_id);
  }
  const topLevelName = (catId: string | null | undefined): string => {
    if (!catId) return "Uncategorized";
    let id: string | null = catId;
    let guard = 0;
    while (id && parentById.get(id) && guard < 6) {
      id = parentById.get(id) ?? null;
      guard++;
    }
    return (id && nameById.get(id)) || "Uncategorized";
  };

  // product id / slug → category id
  const catByProductId = new Map<string, string>();
  const catBySlug = new Map<string, string>();
  for (const p of prods ?? []) {
    if (p.category_id) {
      catByProductId.set(p.id, p.category_id);
      if (p.slug) catBySlug.set(p.slug, p.category_id);
    }
  }

  return (item: OrderItem): string => {
    const catId =
      (item.product_id && catByProductId.get(item.product_id)) ||
      (item.slug && catBySlug.get(item.slug)) ||
      null;
    return topLevelName(catId);
  };
}

// ─── Main entry ──────────────────────────────────────────────────────────────

type AnalyticsRow = Pick<
  Order,
  | "status"
  | "total_usd"
  | "created_at"
  | "region"
  | "city"
  | "items"
>;

export async function getAnalytics(range: ResolvedRange): Promise<AnalyticsData> {
  try {
    const supabase = createServerClient();

    // Current-month bounds (always, regardless of the selected range) for the
    // two "this month" stat cards.
    const now = new Date();
    const monthStartMs = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();

    // Scope the heavy read to the selected window.
    let q = supabase
      .from("orders")
      .select("status,total_usd,created_at,region,city,items");
    if (range.startISO) q = q.gte("created_at", range.startISO);
    q = q.lte("created_at", range.endISO);

    // The two "this month" cards are ALWAYS the true current month, independent
    // of the selected range (which may be narrower, e.g. "Last 7 days"), so they
    // get their own tiny scoped query.
    const monthQ = supabase
      .from("orders")
      .select("status,total_usd")
      .gte("created_at", new Date(monthStartMs).toISOString());

    const [ordersRes, monthRes, resolveCategory] = await Promise.all([
      q,
      monthQ,
      loadCategoryResolver(supabase),
    ]);

    if (ordersRes.error) {
      console.error("[getAnalytics] orders", ordersRes.error.message);
      return emptyData(range.label);
    }

    // Current-month totals (always-current, independent of the range).
    let revenueThisMonth = 0;
    let ordersThisMonth = 0;
    if (monthRes.error) {
      console.error("[getAnalytics] month", monthRes.error.message);
    } else {
      for (const m of (monthRes.data ?? []) as Pick<
        Order,
        "status" | "total_usd"
      >[]) {
        ordersThisMonth += 1;
        if (m.status !== "cancelled") {
          revenueThisMonth += typeof m.total_usd === "number" ? m.total_usd : 0;
        }
      }
    }

    const rows = (ordersRes.data ?? []) as AnalyticsRow[];
    if (rows.length === 0) {
      // No orders in the selected range, but still surface the live month cards.
      const blank = emptyData(range.label);
      blank.totals.revenueThisMonth = round2(revenueThisMonth);
      blank.totals.ordersThisMonth = ordersThisMonth;
      return blank;
    }

    const totals: AnalyticsTotals = { ...EMPTY_TOTALS };
    let nonCancelledCount = 0;

    const statusCounts = new Map<string, number>();
    const seriesInput: SeriesInput[] = [];
    const bySlug = new Map<string, BestSeller>();
    const byCategory = new Map<string, CategoryRevenue>();
    const byRegion = new Map<string, RegionSales>();
    const byCity = new Map<string, CitySales>();

    for (const o of rows) {
      const status = (o.status as string) || "pending";
      const total = typeof o.total_usd === "number" ? o.total_usd : 0;
      const cancelled = status === "cancelled";
      const ms = new Date(o.created_at).getTime();
      const createdMs = Number.isFinite(ms) ? ms : now.getTime();
      const revenue = cancelled ? 0 : total;

      // Status breakdown (all statuses).
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);

      // Range totals.
      totals.orders += 1;
      if (!cancelled) {
        totals.revenue += total;
        nonCancelledCount += 1;
      }

      // Time series.
      seriesInput.push({ ms: createdMs, revenue });

      // Region / city (revenue excludes cancelled; orders count all).
      const region = (o.region || "Unknown").trim() || "Unknown";
      const city = (o.city || "Unknown").trim() || "Unknown";
      const r = byRegion.get(region) ?? { region, orders: 0, revenue: 0 };
      r.orders += 1;
      r.revenue += revenue;
      byRegion.set(region, r);

      const cityKey = `${region}::${city}`;
      const cs = byCity.get(cityKey) ?? { city, region, orders: 0, revenue: 0 };
      cs.orders += 1;
      cs.revenue += revenue;
      byCity.set(cityKey, cs);

      // Item-derived metrics only count non-cancelled sales.
      if (!cancelled) {
        for (const item of (o.items ?? []) as OrderItem[]) {
          const qty = item.quantity || 0;
          if (qty <= 0) continue;
          const lineRevenue = (item.price_usd || 0) * qty;
          totals.productsSold += qty;

          const slug = item.slug || item.product_id;
          if (slug) {
            const prev = bySlug.get(slug);
            bySlug.set(slug, {
              slug,
              name: item.name,
              quantity: (prev?.quantity ?? 0) + qty,
              revenue: (prev?.revenue ?? 0) + lineRevenue,
            });
          }

          const catName = resolveCategory(item);
          const c = byCategory.get(catName) ?? {
            name: catName,
            revenue: 0,
            quantity: 0,
          };
          c.revenue += lineRevenue;
          c.quantity += qty;
          byCategory.set(catName, c);
        }
      }
    }

    totals.revenue = round2(totals.revenue);
    totals.revenueThisMonth = round2(revenueThisMonth);
    totals.ordersThisMonth = ordersThisMonth;
    totals.avgOrderValue =
      nonCancelledCount > 0 ? round2(totals.revenue / nonCancelledCount) : 0;

    const statusBreakdown: StatusSlice[] = [...statusCounts.entries()]
      .map(([status, count]) => ({
        status,
        label: orderStatusLabel(status),
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const bestSellers: BestSeller[] = [...bySlug.values()]
      .map((b) => ({ ...b, revenue: round2(b.revenue) }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const categoryRevenue: CategoryRevenue[] = [...byCategory.values()]
      .map((c) => ({ ...c, revenue: round2(c.revenue) }))
      .filter((c) => c.revenue > 0 || c.quantity > 0)
      .sort((a, b) => b.revenue - a.revenue);

    const regionSales: RegionSales[] = [...byRegion.values()]
      .map((r) => ({ ...r, revenue: round2(r.revenue) }))
      .sort((a, b) => b.revenue - a.revenue);

    const citySales: CitySales[] = [...byCity.values()]
      .map((c) => ({ ...c, revenue: round2(c.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12);

    return {
      rangeLabel: range.label,
      hasData: true,
      totals,
      timeSeries: buildTimeSeries(seriesInput, range),
      statusBreakdown,
      bestSellers,
      categoryRevenue,
      regionSales,
      citySales,
    };
  } catch (err) {
    console.error("[getAnalytics] unexpected", err);
    return emptyData(range.label);
  }
}

// Re-export for the page's convenience.
export { resolveRange };
