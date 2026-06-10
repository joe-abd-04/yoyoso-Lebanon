"use client";

// Action bar for a single order (detail page). Owner flow:
//   • Print Order   — opens a clean black-on-white invoice/picking sheet and
//                     triggers the browser print dialog. If the order is still
//                     'pending', it auto-advances to 'processing'.
//   • Mark Delivered — sets 'delivered' (shown while pending/processing).
//   • Cancel Order   — sets 'cancelled' (shown unless already delivered/cancelled).
//   • Delete Order   — permanently removes the order (confirmation modal), then
//                     returns to the list.
// Every write goes through an admin-verified server action (service-role); the
// UI never decides authorization.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer, CheckCircle2, XCircle, Trash2, Loader2 } from "lucide-react";
import { formatUSD } from "@/lib/formatPrice";
import {
  updateOrderStatus,
  markOrderPrinted,
  deleteOrder,
} from "@/app/admin/orders/actions";
import { useUIStore } from "@/store/uiStore";

export type PrintableItem = {
  sku: string;
  name: string;
  variant: string;
  quantity: number;
  priceUSD: number;
};

export type PrintableOrder = {
  orderNumber: string;
  date: string; // pre-formatted for display
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  deliveryNotes: string | null;
  paymentLabel: string;
  items: PrintableItem[];
  subtotalUSD: number;
  deliveryFeeUSD: number;
  discountUSD: number;
  totalUSD: number;
};

/** Escape text before injecting into the printable HTML document. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildInvoiceHtml(o: PrintableOrder): string {
  const addressParts = [o.addressLine1, o.addressLine2, o.city, o.region]
    .filter(Boolean)
    .map((p) => esc(String(p)))
    .join(", ");

  const rows = o.items
    .map((it) => {
      const lineTotal = it.priceUSD * it.quantity;
      return `<tr>
        <td class="sku">${it.sku ? esc(it.sku) : "—"}</td>
        <td>
          <div class="name">${esc(it.name)}</div>
          ${it.variant ? `<div class="variant">Config: ${esc(it.variant)}</div>` : ""}
        </td>
        <td class="num">${it.quantity}</td>
        <td class="num">${formatUSD(it.priceUSD)}</td>
        <td class="num">${formatUSD(lineTotal)}</td>
      </tr>`;
    })
    .join("");

  const discountRow =
    o.discountUSD > 0
      ? `<tr><td>Discount</td><td class="num">-${formatUSD(o.discountUSD)}</td></tr>`
      : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Order ${esc(o.orderNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    background: #fff;
    margin: 24px;
    font-size: 13px;
    line-height: 1.45;
  }
  h1 { font-size: 22px; margin: 0; }
  .muted { color: #444; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
  .brand { font-size: 20px; font-weight: bold; letter-spacing: 0.5px; }
  .meta { text-align: right; }
  .cols { display: flex; gap: 32px; margin-bottom: 18px; }
  .col { flex: 1; }
  .col h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px; border-bottom: 1px solid #999; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; }
  thead th { text-align: left; border-bottom: 2px solid #000; padding: 6px 8px; font-size: 11px; text-transform: uppercase; }
  tbody td { padding: 7px 8px; border-bottom: 1px solid #ccc; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  th.num { text-align: right; }
  .sku { font-family: "Courier New", monospace; font-weight: bold; white-space: nowrap; }
  .name { font-weight: bold; }
  .variant { color: #444; font-size: 12px; }
  .totals { margin-top: 14px; margin-left: auto; width: 280px; }
  .totals table td { border: none; padding: 3px 8px; }
  .totals .grand td { border-top: 2px solid #000; font-weight: bold; font-size: 15px; padding-top: 8px; }
  .pay { margin-top: 18px; }
  @media print { body { margin: 0; } @page { margin: 16mm; } }
</style>
</head>
<body>
  <div class="head">
    <div>
      <div class="brand">YOYOSO Lebanon</div>
      <div class="muted">Order Picking Sheet</div>
    </div>
    <div class="meta">
      <h1>#${esc(o.orderNumber)}</h1>
      <div class="muted">${esc(o.date)}</div>
    </div>
  </div>

  <div class="cols">
    <div class="col">
      <h2>Customer</h2>
      <div><strong>${esc(o.customerName)}</strong></div>
      <div>${esc(o.customerPhone)}</div>
      <div class="muted">${esc(o.customerEmail)}</div>
    </div>
    <div class="col">
      <h2>Delivery</h2>
      <div>${addressParts}</div>
      ${o.deliveryNotes ? `<div class="muted">Notes: ${esc(o.deliveryNotes)}</div>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Item</th>
        <th class="num">Qty</th>
        <th class="num">Unit</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Subtotal</td><td class="num">${formatUSD(o.subtotalUSD)}</td></tr>
      <tr><td>Delivery</td><td class="num">${o.deliveryFeeUSD > 0 ? formatUSD(o.deliveryFeeUSD) : "Free"}</td></tr>
      ${discountRow}
      <tr class="grand"><td>Total</td><td class="num">${formatUSD(o.totalUSD)}</td></tr>
    </table>
  </div>

  <div class="pay"><strong>Payment:</strong> ${esc(o.paymentLabel)}</div>

  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body>
</html>`;
}

type Pending = "print" | "deliver" | "cancel" | "delete" | null;

export default function OrderActions({
  orderId,
  status,
  printable,
}: {
  orderId: string;
  status: string;
  printable: PrintableOrder;
}) {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const [isPending, startTransition] = useTransition();
  const [pending, setPending] = useState<Pending>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isFinal = status === "delivered" || status === "cancelled";

  const openInvoice = () => {
    // Note: no "noopener" here — it makes window.open return null, and we need
    // the handle to write the invoice document into the new window.
    const win = window.open("", "_blank", "width=820,height=920");
    if (!win) {
      showToast("Please allow pop-ups to print the order.", "error");
      return;
    }
    win.document.write(buildInvoiceHtml(printable));
    win.document.close();
  };

  const handlePrint = () => {
    if (isPending) return;
    setPending("print");
    // Open the print window synchronously (inside the click handler) so the
    // browser doesn't treat it as a blocked pop-up; advance the status after.
    openInvoice();
    startTransition(async () => {
      const result = await markOrderPrinted(orderId);
      if (result.ok) {
        if (status === "pending") router.refresh();
      } else {
        showToast(result.error, "error");
      }
      setPending(null);
    });
  };

  const setStatus = (next: "delivered" | "cancelled", which: Pending) => {
    if (isPending) return;
    setPending(which);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      if (result.ok) {
        showToast(
          next === "delivered" ? "Order marked as delivered." : "Order cancelled.",
          "success",
        );
        router.refresh();
      } else {
        showToast(result.error, "error");
      }
      setPending(null);
    });
  };

  const handleDelete = () => {
    if (isPending) return;
    setPending("delete");
    startTransition(async () => {
      const result = await deleteOrder(orderId);
      if (result.ok) {
        showToast("Order deleted.", "success");
        router.push("/admin/orders");
        router.refresh();
      } else {
        showToast(result.error, "error");
        setPending(null);
        setConfirmDelete(false);
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handlePrint}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {pending === "print" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Printer size={15} />
          )}
          Print Order
        </button>

        {!isFinal && (
          <button
            type="button"
            onClick={() => setStatus("delivered", "deliver")}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-button border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 transition-colors hover:bg-green-100 disabled:opacity-60"
          >
            {pending === "deliver" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            Mark as Delivered
          </button>
        )}

        {!isFinal && (
          <button
            type="button"
            onClick={() => setStatus("cancelled", "cancel")}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-button border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:opacity-60"
          >
            {pending === "cancel" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <XCircle size={15} />
            )}
            Cancel Order
          </button>
        )}

        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-button border border-border bg-white px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>

      {/* Delete confirmation modal */}
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
                  Delete order #{printable.orderNumber}?
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  This permanently removes the order. This action cannot be undone.
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
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-button bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
              >
                {pending === "delete" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                Delete order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
