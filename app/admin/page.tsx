import Link from "next/link";
import {
  Package,
  ClipboardList,
  Clock,
  Loader,
  CheckCircle2,
  XCircle,
  CalendarDays,
  CalendarRange,
  PackageX,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { getDashboardStats } from "@/lib/data/admin-stats";
import { formatUSD } from "@/lib/formatPrice";
import { orderStatusLabel, orderStatusStyle } from "@/lib/orders/status";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const stats = await getDashboardStats();

  const firstName =
    (user.user_metadata?.first_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
        Welcome back, {firstName}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Here&apos;s how your YOYOSO store is doing.
      </p>

      {/* Orders by status */}
      <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-text-secondary">
        Orders
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<ClipboardList size={20} />}
          label="Total orders"
          value={stats.orders.total}
          href="/admin/orders"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Pending"
          value={stats.orders.pending}
          href="/admin/orders?status=pending"
          tone="amber"
        />
        <StatCard
          icon={<Loader size={20} />}
          label="Processing"
          value={stats.orders.processing}
          href="/admin/orders?status=processing"
          tone="blue"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Delivered"
          value={stats.orders.delivered}
          href="/admin/orders?status=delivered"
          tone="green"
        />
      </div>

      {/* Activity */}
      <h2 className="mt-7 text-xs font-bold uppercase tracking-wide text-text-secondary">
        Activity
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<CalendarDays size={20} />}
          label="Orders today"
          value={stats.orders.today}
        />
        <StatCard
          icon={<CalendarRange size={20} />}
          label="Orders this month"
          value={stats.orders.month}
        />
      </div>

      {/* Catalog */}
      <h2 className="mt-7 text-xs font-bold uppercase tracking-wide text-text-secondary">
        Catalog
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Package size={20} />}
          label="Products"
          value={stats.products.total}
          href="/admin/products"
        />
        <StatCard
          icon={<PackageX size={20} />}
          label="Out of stock"
          value={stats.products.outOfStock}
          href="/admin/products?stock=out"
          tone={stats.products.outOfStock > 0 ? "red" : undefined}
        />
        {stats.orders.cancelled > 0 && (
          <StatCard
            icon={<XCircle size={20} />}
            label="Cancelled orders"
            value={stats.orders.cancelled}
            href="/admin/orders?status=cancelled"
            tone="red"
          />
        )}
      </div>

      {/* Recent orders + top products */}
      <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentOrders orders={stats.recentOrders} />
        <TopProducts products={stats.topProducts} />
      </div>
    </div>
  );
}

// ── Stat card ───────────────────────────────────────────────────────────────────

type Tone = "amber" | "blue" | "green" | "red";

const TONES: Record<Tone, string> = {
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
};

function StatCard({
  icon,
  label,
  value,
  href,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  href?: string;
  tone?: Tone;
  hint?: string;
}) {
  const iconClass = tone ? TONES[tone] : "bg-primary/10 text-primary";
  const inner = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-text-secondary">
          {label}
        </p>
        <p className="font-heading text-xl font-extrabold text-text-primary sm:text-2xl">
          {value}
        </p>
        {hint && <p className="text-[11px] text-text-secondary">{hint}</p>}
      </div>
    </>
  );

  const base =
    "flex items-center gap-3 rounded-card border border-border bg-white p-4 shadow-sm";

  if (href) {
    return (
      <Link
        href={href}
        className={`${base} transition-all hover:-translate-y-0.5 hover:shadow-md`}
      >
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
}

// ── Recent orders ────────────────────────────────────────────────────────────────

function RecentOrders({
  orders,
}: {
  orders: {
    id: string;
    orderNumber: string;
    createdAt: string;
    customerName: string;
    totalUSD: number;
    status: string;
  }[];
}) {
  return (
    <div className="rounded-card border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-text-primary">
          Recent orders
        </h2>
        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          View all
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">No orders yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between gap-3 py-3 transition-colors hover:opacity-80"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {o.orderNumber}
                  </p>
                  <p className="truncate text-xs text-text-secondary">
                    {o.customerName} ·{" "}
                    {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">
                    {formatUSD(o.totalUSD)}
                  </span>
                  <span
                    className={`rounded-badge px-2 py-0.5 text-[11px] font-bold ${orderStatusStyle(
                      o.status,
                    )}`}
                  >
                    {orderStatusLabel(o.status)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Top products ────────────────────────────────────────────────────────────────

function TopProducts({
  products,
}: {
  products: { slug: string; name: string; quantity: number }[];
}) {
  return (
    <div className="rounded-card border border-border bg-white p-5 shadow-sm">
      <h2 className="font-heading text-lg font-bold text-text-primary">
        Best sellers
      </h2>
      <p className="mt-0.5 text-xs text-text-secondary">
        By units ordered (excludes cancelled).
      </p>

      {products.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">No sales yet.</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {products.map((p, i) => (
            <li key={p.slug} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                {p.name}
              </span>
              <span className="shrink-0 text-sm font-bold text-text-primary">
                {p.quantity}
                <span className="ml-1 text-xs font-normal text-text-secondary">
                  sold
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
