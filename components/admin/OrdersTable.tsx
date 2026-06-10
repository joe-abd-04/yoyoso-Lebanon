"use client";

// Admin orders table with row selection + a bulk action bar. Checkboxes select
// individual orders (plus a select-all-on-this-page header checkbox). When any
// row is selected, a bar appears with Mark Delivered / Mark Cancelled / Delete
// (Delete confirms first). Each action runs through an admin-verified server
// action (service-role), then refreshes the list and clears the selection.

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Trash2, Loader2, X } from "lucide-react";
import { orderStatusLabel, orderStatusStyle } from "@/lib/orders/status";
import { formatUSD } from "@/lib/formatPrice";
import { useUIStore } from "@/store/uiStore";
import {
  bulkUpdateOrderStatus,
  bulkDeleteOrders,
} from "@/app/admin/orders/actions";
import type { AdminOrderListItem } from "@/lib/data/admin-orders";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type BulkKind = "deliver" | "cancel" | "delete" | null;

export default function OrdersTable({ items }: { items: AdminOrderListItem[] }) {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const [isPending, startTransition] = useTransition();
  const [running, setRunning] = useState<BulkKind>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Selected order ids. Cleared on a successful bulk action.
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pageIds = useMemo(() => items.map((o) => o.id), [items]);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      // If every row on the page is selected, clear them; otherwise select all.
      const everySelected = pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (everySelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const runStatus = (status: "delivered" | "cancelled", kind: BulkKind) => {
    if (isPending) return;
    const ids = [...selected];
    setRunning(kind);
    startTransition(async () => {
      const result = await bulkUpdateOrderStatus(ids, status);
      if (result.ok) {
        showToast(
          `${result.count} order${result.count !== 1 ? "s" : ""} ${
            status === "delivered" ? "marked delivered" : "cancelled"
          }.`,
          "success",
        );
        clearSelection();
        router.refresh();
      } else {
        showToast(result.error, "error");
      }
      setRunning(null);
    });
  };

  const runDelete = () => {
    if (isPending) return;
    const ids = [...selected];
    setRunning("delete");
    startTransition(async () => {
      const result = await bulkDeleteOrders(ids);
      if (result.ok) {
        showToast(
          `${result.count} order${result.count !== 1 ? "s" : ""} deleted.`,
          "success",
        );
        clearSelection();
        setConfirmDelete(false);
        router.refresh();
      } else {
        showToast(result.error, "error");
      }
      setRunning(null);
    });
  };

  return (
    <>
      {/* Bulk action bar */}
      {someSelected && (
        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-card border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-sm font-semibold text-text-primary">
            {selected.size} selected
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runStatus("delivered", "deliver")}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-button border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-800 transition-colors hover:bg-green-100 disabled:opacity-60"
            >
              {running === "deliver" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              Mark Delivered
            </button>
            <button
              type="button"
              onClick={() => runStatus("cancelled", "cancel")}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-button border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:opacity-60"
            >
              {running === "cancel" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <XCircle size={15} />
              )}
              Mark Cancelled
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-button border border-border bg-white px-3 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
            >
              <Trash2 size={15} />
              Delete
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={isPending}
              aria-label="Clear selection"
              className="inline-flex items-center gap-1.5 rounded-button px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary disabled:opacity-60"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-card border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-xs uppercase tracking-wide text-text-secondary">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all orders on this page"
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => {
                const checked = selected.has(o.id);
                return (
                  <tr
                    key={o.id}
                    className={`border-b border-border last:border-0 hover:bg-surface/60 ${
                      checked ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(o.id)}
                        aria-label={`Select order ${o.orderNumber}`}
                        className="h-4 w-4 cursor-pointer accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-semibold text-primary hover:text-primary-dark hover:underline"
                      >
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {o.customerName}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {o.customerPhone}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {o.itemCount}
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-primary">
                      {formatUSD(o.totalUSD)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-badge px-2.5 py-0.5 text-xs font-bold ${orderStatusStyle(
                          o.status,
                        )}`}
                      >
                        {orderStatusLabel(o.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => !isPending && setConfirmDelete(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-card border border-border bg-white p-6 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Trash2 size={20} />
              </span>
              <div>
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  Delete {selected.size} order{selected.size !== 1 ? "s" : ""}?
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  This permanently removes the selected orders. This action cannot
                  be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isPending}
                className="rounded-button border border-border bg-white px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runDelete}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-button bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
              >
                {running === "delete" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                Delete orders
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
