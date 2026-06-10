import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import {
  listAdminOrders,
  ADMIN_ORDERS_PAGE_SIZE,
  type OrderStatusFilter,
  type OrderSort,
} from "@/lib/data/admin-orders";
import { orderStatusLabel } from "@/lib/orders/status";
import OrdersToolbar from "@/components/admin/OrdersToolbar";
import OrdersTable from "@/components/admin/OrdersTable";

const STATUS_VALUES: OrderStatusFilter[] = [
  "all",
  "pending",
  "processing",
  "delivered",
  "cancelled",
];

function buildHref(
  base: { q?: string; status?: string; sort?: OrderSort },
  page: number,
): string {
  const p = new URLSearchParams();
  if (base.q) p.set("q", base.q);
  if (base.status && base.status !== "all") p.set("status", base.status);
  if (base.sort && base.sort !== "newest") p.set("sort", base.sort);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    sort?: string;
  }>;
}) {
  await requireAdmin();

  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 100);
  const status: OrderStatusFilter = STATUS_VALUES.includes(
    sp.status as OrderStatusFilter,
  )
    ? (sp.status as OrderStatusFilter)
    : "all";
  const sort: OrderSort = sp.sort === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, Number(sp.page) || 1);

  const { items, total, totalPages } = await listAdminOrders({
    page,
    search: q,
    status,
    sort,
  });

  const base = { q, status, sort };
  const startIndex = total === 0 ? 0 : (page - 1) * ADMIN_ORDERS_PAGE_SIZE + 1;
  const endIndex = Math.min(page * ADMIN_ORDERS_PAGE_SIZE, total);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {total} order{total !== 1 ? "s" : ""}
          {status !== "all" ? ` · ${orderStatusLabel(status)}` : ""}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mt-5">
        <OrdersToolbar search={q} status={status} sort={sort} />
      </div>

      {/* Table / empty state */}
      {items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-white p-12 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList size={26} />
          </span>
          <p className="mt-4 font-bold text-text-primary">No orders found</p>
          <p className="mt-1 max-w-md text-sm text-text-secondary">
            {q || status !== "all"
              ? "Try adjusting your search or filter."
              : "Orders placed by customers will appear here."}
          </p>
        </div>
      ) : (
        <OrdersTable items={items} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            Showing {startIndex}–{endIndex} of {total}
          </p>
          <div className="flex items-center gap-2">
            <PageLink
              href={buildHref(base, page - 1)}
              disabled={page <= 1}
              label="Previous page"
            >
              <ChevronLeft size={16} />
            </PageLink>
            <span className="text-sm font-medium text-text-primary">
              Page {page} of {totalPages}
            </span>
            <PageLink
              href={buildHref(base, page + 1)}
              disabled={page >= totalPages}
              label="Next page"
            >
              <ChevronRight size={16} />
            </PageLink>
          </div>
        </div>
      )}
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="flex h-9 w-9 items-center justify-center rounded-button border border-border bg-white text-text-secondary opacity-40"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-button border border-border bg-white text-text-primary transition-colors hover:border-primary hover:text-primary"
    >
      {children}
    </Link>
  );
}
