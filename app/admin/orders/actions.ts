"use server";

// SERVER ACTION — update an order's status.
//
// Security model (same as the product actions):
//   • Verifies the caller is an admin server-side (getAdminUser) before any
//     write. The UI never decides authorization.
//   • Only the three owner-approved statuses are accepted (re-validated here,
//     never trusting the client).
//   • The write uses the service-role server client (server-only; the secret key
//     never reaches the browser). Customers can't change any order's status —
//     there is no client-callable path that bypasses this gate, and RLS gives
//     them no UPDATE on orders anyway.

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/admin";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminOrderStatus, type AdminOrderStatus } from "@/lib/orders/status";

export type OrderActionResult =
  | { ok: true; status: AdminOrderStatus }
  | { ok: false; error: string };

export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<OrderActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not authorized to do that." };

  if (!id) return { ok: false, error: "Missing order id." };
  if (!isAdminOrderStatus(status)) {
    return { ok: false, error: "Invalid status." };
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[updateOrderStatus]", error.message);
    return { ok: false, error: "Could not update the order. Please try again." };
  }

  revalidateOrderRoutes(id);
  return { ok: true, status };
}

// Revalidate the orders list, this order's detail, dashboard, and sidebar
// pending-count so they all reflect the change immediately.
function revalidateOrderRoutes(id: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
}

export type PrintOrderResult =
  | { ok: true; status: AdminOrderStatus }
  | { ok: false; error: string };

/**
 * Called when the admin prints an order. If the order is currently 'pending',
 * it automatically advances to 'processing'. Any other status is left untouched
 * (printing a delivered/cancelled order must not change it). Admin-verified.
 */
export async function markOrderPrinted(id: string): Promise<PrintOrderResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not authorized to do that." };
  if (!id) return { ok: false, error: "Missing order id." };

  const supabase = createServerClient();

  const { data: row, error: readErr } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (readErr || !row) {
    if (readErr) console.error("[markOrderPrinted] read", readErr.message);
    return { ok: false, error: "Could not find the order." };
  }

  // Only pending → processing; leave everything else as-is.
  if (row.status !== "pending") {
    return { ok: true, status: row.status as AdminOrderStatus };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "processing" })
    .eq("id", id);

  if (error) {
    console.error("[markOrderPrinted] update", error.message);
    return { ok: false, error: "Could not update the order status." };
  }

  revalidateOrderRoutes(id);
  return { ok: true, status: "processing" };
}

export type DeleteOrderResult =
  | { ok: true }
  | { ok: false; error: string };

/** Permanently delete an order row. Admin-verified, service-role write. */
export async function deleteOrder(id: string): Promise<DeleteOrderResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not authorized to do that." };
  if (!id) return { ok: false, error: "Missing order id." };

  const supabase = createServerClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) {
    console.error("[deleteOrder]", error.message);
    return { ok: false, error: "Could not delete the order. Please try again." };
  }

  revalidateOrderRoutes(id);
  return { ok: true };
}

// ── Bulk actions (orders list) ──────────────────────────────────────────────
// Each verifies the caller is an admin server-side, re-validates input, then
// applies to all selected orders with a single service-role write (.in(ids)).
// Customers have no path to these — RLS gives them no UPDATE/DELETE on orders.

const MAX_BULK = 500;

/** Validate + de-duplicate the selected id list. */
function cleanIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const out = new Set<string>();
  for (const id of ids) {
    if (typeof id === "string" && id) out.add(id);
    if (out.size >= MAX_BULK) break;
  }
  return [...out];
}

export type BulkActionResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

/** Set the same status on many orders at once. Only delivered/cancelled allowed. */
export async function bulkUpdateOrderStatus(
  ids: string[],
  status: string,
): Promise<BulkActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not authorized to do that." };

  if (status !== "delivered" && status !== "cancelled") {
    return { ok: false, error: "Invalid status." };
  }
  const list = cleanIds(ids);
  if (list.length === 0) return { ok: false, error: "No orders selected." };

  const supabase = createServerClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .in("id", list);

  if (error) {
    console.error("[bulkUpdateOrderStatus]", error.message);
    return { ok: false, error: "Could not update the selected orders." };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true, count: list.length };
}

/** Permanently delete many orders at once. */
export async function bulkDeleteOrders(ids: string[]): Promise<BulkActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not authorized to do that." };

  const list = cleanIds(ids);
  if (list.length === 0) return { ok: false, error: "No orders selected." };

  const supabase = createServerClient();
  const { error } = await supabase.from("orders").delete().in("id", list);

  if (error) {
    console.error("[bulkDeleteOrders]", error.message);
    return { ok: false, error: "Could not delete the selected orders." };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true, count: list.length };
}
