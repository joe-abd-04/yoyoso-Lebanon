import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, User, MapPin, Package } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminOrderById } from "@/lib/data/admin-orders";
import { getProducts } from "@/lib/data/products";
import { orderStatusLabel, orderStatusStyle } from "@/lib/orders/status";
import { formatUSD } from "@/lib/formatPrice";
import OrderActions, {
  type PrintableOrder,
} from "@/components/admin/OrderActions";

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: "Cash on Delivery",
  bank_transfer: "Bank Transfer",
  whatsapp: "WhatsApp",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const order = await getAdminOrderById(id);
  if (!order) notFound();

  const paymentLabel =
    PAYMENT_LABELS[order.payment_method] ?? order.payment_method;
  const hasDiscount = order.discount_usd > 0;

  // Resolve each item's SKU: prefer the snapshot stored on the order item; fall
  // back to the product's current SKU (by product id) for legacy orders that
  // predate SKU capture.
  const catalog = await getProducts();
  const skuByProductId = new Map(catalog.map((p) => [p.id, p.sku ?? ""]));
  const items = order.items.map((it) => ({
    ...it,
    resolvedSku: it.sku || skuByProductId.get(it.product_id) || "",
  }));

  // Plain, serializable data for the client-side printable invoice.
  const printable: PrintableOrder = {
    orderNumber: order.order_number,
    date: formatDateTime(order.created_at),
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email,
    addressLine1: order.address_line1,
    addressLine2: order.address_line2,
    city: order.city,
    region: order.region,
    deliveryNotes: order.delivery_notes,
    paymentLabel,
    items: items.map((it) => ({
      sku: it.resolvedSku,
      name: it.name,
      variant: it.variant ?? "",
      quantity: it.quantity,
      priceUSD: it.price_usd,
    })),
    subtotalUSD: order.subtotal_usd,
    deliveryFeeUSD: order.delivery_fee_usd,
    discountUSD: order.discount_usd,
    totalUSD: order.total_usd,
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary transition-colors hover:text-primary"
      >
        <ChevronLeft size={16} />
        Back to orders
      </Link>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
            #{order.order_number}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {formatDateTime(order.created_at)}
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

      {/* Actions */}
      <section className="mt-6 rounded-card border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 font-heading text-lg font-bold text-text-primary">
          Actions
        </h2>
        <p className="mb-4 text-xs text-text-secondary">
          Printing a pending order moves it to <strong>Processing</strong>. The
          customer sees the status in their account order history.
        </p>
        <OrderActions
          orderId={order.id}
          status={order.status}
          printable={printable}
        />
      </section>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Customer */}
        <section className="rounded-card border border-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-bold text-text-primary">
            <User size={17} className="text-primary" />
            Customer
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Name" value={order.customer_name} />
            <Row label="Email" value={order.customer_email} />
            <Row label="Phone" value={order.customer_phone} />
          </dl>
        </section>

        {/* Delivery */}
        <section className="rounded-card border border-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-bold text-text-primary">
            <MapPin size={17} className="text-primary" />
            Delivery
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Address" value={order.address_line1} />
            {order.address_line2 && <Row label="" value={order.address_line2} />}
            <Row label="City" value={order.city} />
            <Row label="Region" value={order.region} />
            {order.delivery_notes && (
              <Row label="Notes" value={order.delivery_notes} />
            )}
          </dl>
        </section>
      </div>

      {/* Items */}
      <section className="mt-5 rounded-card border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-bold text-text-primary">
          <Package size={17} className="text-primary" />
          Items
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-text-secondary">
                <th className="py-2 pr-3 font-semibold">SKU</th>
                <th className="py-2 px-3 font-semibold">Product</th>
                <th className="py-2 px-3 text-center font-semibold">Qty</th>
                <th className="py-2 px-3 text-right font-semibold">Unit</th>
                <th className="py-2 pl-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={`${order.id}-${i}`} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-text-primary">
                    {item.resolvedSku || "—"}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-text-primary">
                      {item.name}
                    </span>
                    {item.variant && (
                      <span className="mt-0.5 block text-xs text-text-secondary">
                        {item.variant}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center text-text-secondary">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right text-text-secondary">
                    {formatUSD(item.price_usd)}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-semibold text-text-primary">
                    {formatUSD(item.price_usd * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
          <TotalRow label="Subtotal" value={formatUSD(order.subtotal_usd)} />
          <TotalRow
            label="Delivery fee"
            value={
              order.delivery_fee_usd > 0
                ? formatUSD(order.delivery_fee_usd)
                : "Free"
            }
          />
          {hasDiscount && (
            <TotalRow
              label="Discount"
              value={`−${formatUSD(order.discount_usd)}`}
              accent
            />
          )}
          <div className="mt-1 flex justify-between border-t border-border pt-2.5">
            <span className="font-bold text-text-primary">Total</span>
            <span className="font-heading text-lg font-extrabold text-primary">
              {formatUSD(order.total_usd)}
            </span>
          </div>
        </dl>

        <p className="mt-4 text-sm text-text-secondary">
          Payment method:{" "}
          <span className="font-semibold text-text-primary">{paymentLabel}</span>
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-text-secondary">{label}</dt>
      <dd className="text-text-primary">{value}</dd>
    </div>
  );
}

function TotalRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-text-secondary">{label}</dt>
      <dd className={accent ? "font-medium text-accent" : "text-text-primary"}>
        {value}
      </dd>
    </div>
  );
}
