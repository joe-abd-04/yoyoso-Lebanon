// SERVER-ONLY data access for the ADMIN orders screens.
// Uses the service-role server client, so import ONLY from Server Components /
// Server Actions inside /admin (which are gated by requireAdmin()). Admins are
// the only ones allowed to read EVERY order; customers read just their own via
// the cookie/anon client + RLS (see app/(account)/account/orders).
//
// Like lib/data/admin-products.ts, the list query paginates at the database
// level with .range() + an exact count, so it scales to a large order volume
// without ever loading them all into memory.

import { createServerClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/lib/supabase/types";

export const ADMIN_ORDERS_PAGE_SIZE = 20;

export type OrderStatusFilter =
  | "all"
  | "pending"
  | "processing"
  | "delivered"
  | "cancelled";

/** Date sort direction for the admin orders list. */
export type OrderSort = "newest" | "oldest";

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  itemCount: number;
  totalUSD: number;
  status: string;
};

export type ListAdminOrdersResult = {
  items: AdminOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * Strip characters that are significant inside a PostgREST `.or()` filter string
 * (commas separate conditions, parentheses group, `*` is the ilike wildcard) so
 * a user's search term can't break or inject into the query.
 */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()*\\%]/g, "").trim().slice(0, 100);
}

function itemCountOf(items: OrderItem[] | null | undefined): number {
  return (items ?? []).reduce((sum, i) => sum + (i.quantity || 0), 0);
}

/** One page of orders matching the given filters, sorted by date (default newest). */
export async function listAdminOrders(opts: {
  page?: number;
  search?: string;
  status?: OrderStatusFilter;
  sort?: OrderSort;
}): Promise<ListAdminOrdersResult> {
  const supabase = createServerClient();
  const pageSize = ADMIN_ORDERS_PAGE_SIZE;
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("orders").select("*", { count: "exact" });

  const term = sanitizeSearchTerm(opts.search ?? "");
  if (term) {
    query = query.or(
      `order_number.ilike.*${term}*,customer_name.ilike.*${term}*,customer_phone.ilike.*${term}*`,
    );
  }
  if (opts.status && opts.status !== "all") {
    query = query.eq("status", opts.status);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: opts.sort === "oldest" })
    .range(from, to);

  if (error) {
    console.error("[listAdminOrders]", error.message);
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const items: AdminOrderListItem[] = (data ?? []).map((o: Order) => ({
    id: o.id,
    orderNumber: o.order_number,
    createdAt: o.created_at,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    itemCount: itemCountOf(o.items),
    totalUSD: o.total_usd,
    status: o.status,
  }));

  const total = count ?? 0;
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/** A single full order row by id (for the detail page), or null. */
export async function getAdminOrderById(id: string): Promise<Order | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getAdminOrderById]", error.message);
    return null;
  }
  return data;
}

/** Count of orders awaiting action (status = 'pending'). 0 on error. */
export async function getPendingOrdersCount(): Promise<number> {
  try {
    const supabase = createServerClient();
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    if (error) {
      console.error("[getPendingOrdersCount]", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error("[getPendingOrdersCount] unexpected", err);
    return 0;
  }
}

/** At-a-glance order numbers for the dashboard. Best-effort (nulls on error). */
export async function getOrdersSummary(): Promise<{
  total: number | null;
  pending: number | null;
}> {
  try {
    const supabase = createServerClient();
    const [{ count: total }, { count: pending }] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);
    return { total: total ?? null, pending: pending ?? null };
  } catch (err) {
    console.error("[getOrdersSummary] unexpected", err);
    return { total: null, pending: null };
  }
}
