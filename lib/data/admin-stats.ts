// SERVER-ONLY data access for the admin dashboard stats.
// Uses the service-role server client — import ONLY from Server Components inside
// /admin (gated by requireAdmin()).
//
// Strategy: one pass over the orders table (selecting just the columns we need)
// computes every order/revenue figure + best-sellers in memory, plus two cheap
// head-count queries for products and one small query for the recent list. This
// is fine at this store's scale; if order volume ever grows large, move the
// aggregates into a Postgres view / RPC.

import { createServerClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/lib/supabase/types";

export interface RecentOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  totalUSD: number;
  status: string;
}

export interface TopProduct {
  slug: string;
  name: string;
  quantity: number;
}

export interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    processing: number;
    delivered: number;
    cancelled: number;
    today: number;
    month: number;
  };
  revenue: {
    total: number; // non-cancelled, all time
    month: number; // non-cancelled, this calendar month
  };
  products: {
    total: number;
    outOfStock: number;
  };
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
}

const EMPTY: DashboardStats = {
  orders: {
    total: 0,
    pending: 0,
    processing: 0,
    delivered: 0,
    cancelled: 0,
    today: 0,
    month: 0,
  },
  revenue: { total: 0, month: 0 },
  products: { total: 0, outOfStock: 0 },
  recentOrders: [],
  topProducts: [],
};

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface OrdersRangeResult {
  count: number; // all orders created in the window (incl. cancelled)
  revenue: number; // sum of totals, EXCLUDING cancelled (matches analytics)
}

/**
 * Order count + revenue for a created_at window. `startISO` null = no lower
 * bound (all time). Selects only the two needed columns and sums server-side —
 * never ships order rows to the client. Fails soft to zeroes.
 */
export async function getOrdersInRange(
  startISO: string | null,
  endISO: string,
): Promise<OrdersRangeResult> {
  try {
    const supabase = createServerClient();
    let query = supabase
      .from("orders")
      .select("total_usd,status")
      .lte("created_at", endISO);
    if (startISO) query = query.gte("created_at", startISO);

    const { data, error } = await query;
    if (error || !data) {
      if (error) console.error("[getOrdersInRange]", error.message);
      return { count: 0, revenue: 0 };
    }

    let count = 0;
    let revenue = 0;
    for (const o of data) {
      count += 1;
      if (o.status !== "cancelled") {
        revenue += typeof o.total_usd === "number" ? o.total_usd : 0;
      }
    }
    return { count, revenue: money(revenue) };
  } catch (err) {
    console.error("[getOrdersInRange] unexpected", err);
    return { count: 0, revenue: 0 };
  }
}

type OrderAggRow = Pick<
  Order,
  "status" | "total_usd" | "created_at" | "items"
>;

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = createServerClient();

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();

    const [ordersRes, productsTotalRes, outOfStockRes, recentRes] =
      await Promise.all([
        supabase
          .from("orders")
          .select("status,total_usd,created_at,items"),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("in_stock", false),
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    const stats: DashboardStats = {
      orders: { ...EMPTY.orders },
      revenue: { ...EMPTY.revenue },
      products: {
        total: productsTotalRes.count ?? 0,
        outOfStock: outOfStockRes.count ?? 0,
      },
      recentOrders: [],
      topProducts: [],
    };

    if (ordersRes.error) {
      console.error("[getDashboardStats] orders", ordersRes.error.message);
    } else {
      const rows = (ordersRes.data ?? []) as OrderAggRow[];
      const qtyBySlug = new Map<string, TopProduct>();

      for (const o of rows) {
        const status = o.status as string;
        const total = typeof o.total_usd === "number" ? o.total_usd : 0;
        const created = new Date(o.created_at).getTime();
        const cancelled = status === "cancelled";

        stats.orders.total += 1;
        if (status === "pending") stats.orders.pending += 1;
        else if (status === "processing") stats.orders.processing += 1;
        else if (status === "delivered") stats.orders.delivered += 1;
        else if (cancelled) stats.orders.cancelled += 1;

        if (created >= startOfToday) stats.orders.today += 1;
        if (created >= startOfMonth) stats.orders.month += 1;

        // Revenue excludes cancelled orders.
        if (!cancelled) {
          stats.revenue.total += total;
          if (created >= startOfMonth) stats.revenue.month += total;

          for (const item of (o.items ?? []) as OrderItem[]) {
            const slug = item.slug || item.product_id;
            if (!slug) continue;
            const prev = qtyBySlug.get(slug);
            const quantity = (prev?.quantity ?? 0) + (item.quantity || 0);
            qtyBySlug.set(slug, { slug, name: item.name, quantity });
          }
        }
      }

      stats.revenue.total = money(stats.revenue.total);
      stats.revenue.month = money(stats.revenue.month);

      stats.topProducts = [...qtyBySlug.values()]
        .filter((p) => p.quantity > 0)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    }

    if (recentRes.error) {
      console.error("[getDashboardStats] recent", recentRes.error.message);
    } else {
      stats.recentOrders = (recentRes.data ?? []).map((o: Order) => ({
        id: o.id,
        orderNumber: o.order_number,
        createdAt: o.created_at,
        customerName: o.customer_name,
        totalUSD: o.total_usd,
        status: o.status,
      }));
    }

    return stats;
  } catch (err) {
    console.error("[getDashboardStats] unexpected", err);
    return EMPTY;
  }
}
