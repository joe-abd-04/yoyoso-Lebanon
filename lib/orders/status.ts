// Display helpers for order status. Plain TS (no server-only imports), so this
// is safe to use in both Server and Client Components.

import type { OrderStatus } from "@/lib/supabase/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Tailwind classes for a small status pill. */
export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  out_for_delivery: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

/** Label for any status value, tolerant of unknown strings from the DB. */
export function orderStatusLabel(status: string | null | undefined): string {
  if (status && status in ORDER_STATUS_LABELS) {
    return ORDER_STATUS_LABELS[status as OrderStatus];
  }
  return "Pending";
}

/** Pill classes for any status value, tolerant of unknown strings. */
export function orderStatusStyle(status: string | null | undefined): string {
  if (status && status in ORDER_STATUS_STYLES) {
    return ORDER_STATUS_STYLES[status as OrderStatus];
  }
  return ORDER_STATUS_STYLES.pending;
}

// The statuses an admin order can move through, per the store owner's flow:
//   pending → (Print) → processing → (Mark Delivered) → delivered
//   cancelled can be set at any point.
// Used by the server action's re-validation — keep in sync with the UI controls.
export const ADMIN_ORDER_STATUSES = [
  "pending",
  "processing",
  "delivered",
  "cancelled",
] as const satisfies readonly OrderStatus[];

export type AdminOrderStatus = (typeof ADMIN_ORDER_STATUSES)[number];

/** Type guard: is this string one of the admin-settable statuses? */
export function isAdminOrderStatus(v: unknown): v is AdminOrderStatus {
  return (
    typeof v === "string" &&
    (ADMIN_ORDER_STATUSES as readonly string[]).includes(v)
  );
}
