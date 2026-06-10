import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ArrowLeft } from "lucide-react";
import {
  getCurrentUser,
  createServerAuthClient,
} from "@/lib/supabase/server-auth";
import { buildMetadata } from "@/lib/seo";
import { formatUSD } from "@/lib/formatPrice";
import { orderStatusLabel, orderStatusStyle } from "@/lib/orders/status";
import type { Order } from "@/lib/supabase/types";

export const metadata: Metadata = buildMetadata({
  title: "My Orders",
  description: "Your YOYOSO order history.",
  path: "/account/orders",
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/orders");

  // Read THIS user's orders. RLS ("orders: read own") already restricts rows to
  // auth.uid() = user_id; the explicit filter is belt-and-braces. The
  // cookie-aware anon client runs under the user's RLS context (not admin).
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[account/orders] read error:", error.message);
  }
  const orders = (data ?? []) as Order[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
      >
        <ArrowLeft size={16} />
        Back to Account
      </Link>

      <h1 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-white py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Package size={30} strokeWidth={1.5} className="text-primary" />
          </div>
          <h2 className="mt-4 font-heading text-xl font-bold text-text-primary">
            No orders yet
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-text-secondary">
            When you place an order, it will appear here so you can track its
            status.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-button bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => {
            const itemCount = order.items.reduce(
              (sum, i) => sum + i.quantity,
              0,
            );
            return (
              <li
                key={order.id}
                className="rounded-card border border-border bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-base font-bold text-text-primary">
                      #{order.order_number}
                    </p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {formatDate(order.created_at)} · {itemCount}{" "}
                      {itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-badge px-3 py-1 text-xs font-bold ${orderStatusStyle(
                      order.status,
                    )}`}
                  >
                    {orderStatusLabel(order.status)}
                  </span>
                </div>

                <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {order.items.map((item, i) => (
                    <li
                      key={`${order.id}-${i}`}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span className="text-text-primary">
                        {item.name}
                        {item.variant ? ` (${item.variant})` : ""} ×{" "}
                        {item.quantity}
                      </span>
                      <span className="shrink-0 font-medium text-text-primary">
                        {formatUSD(item.price_usd * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm">
                  <span className="font-bold text-text-primary">Total</span>
                  <span className="font-bold text-primary">
                    {formatUSD(order.total_usd)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
