import Link from "next/link";
import { Plus, Pencil, ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
import { requireAdmin } from "@/lib/auth/admin";
import {
  listAdminProducts,
  getCategoryOptions,
  type StockFilter,
} from "@/lib/data/admin-products";
import ProductsToolbar from "@/components/admin/ProductsToolbar";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

const STOCK_VALUES: StockFilter[] = ["all", "in", "out"];

function fmtUSD(n: number): string {
  return `$${n.toFixed(2)}`;
}

function buildHref(
  base: { q?: string; category?: string; stock?: string },
  page: number,
): string {
  const p = new URLSearchParams();
  if (base.q) p.set("q", base.q);
  if (base.category) p.set("category", base.category);
  if (base.stock && base.stock !== "all") p.set("stock", base.stock);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    stock?: string;
    page?: string;
  }>;
}) {
  await requireAdmin();

  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 100);
  const categoryId = sp.category ?? "";
  const stock: StockFilter = STOCK_VALUES.includes(sp.stock as StockFilter)
    ? (sp.stock as StockFilter)
    : "all";
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ items, total, totalPages }, categories] = await Promise.all([
    listAdminProducts({ page, search: q, categoryId, stock }),
    getCategoryOptions(),
  ]);

  const base = { q, category: categoryId, stock };
  const startIndex = total === 0 ? 0 : (page - 1) * 20 + 1;
  const endIndex = Math.min(page * 20, total);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
            Products
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {total} product{total !== 1 ? "s" : ""} in your catalog
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-button bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* Toolbar */}
      <div className="mt-5">
        <ProductsToolbar
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          search={q}
          categoryId={categoryId}
          stock={stock}
        />
      </div>

      {/* Table / empty state */}
      {items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-white p-12 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <PackageOpen size={26} />
          </span>
          <p className="mt-4 font-bold text-text-primary">No products found</p>
          <p className="mt-1 max-w-md text-sm text-text-secondary">
            {q || categoryId || stock !== "all"
              ? "Try adjusting your search or filters."
              : "Add your first product to get started."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-card border border-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs uppercase tracking-wide text-text-secondary">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Badge</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 hover:bg-surface/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.thumbnail}
                          alt={p.name}
                          className="h-11 w-11 shrink-0 rounded-lg border border-border object-cover"
                        />
                        <span className="font-semibold text-text-primary">
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {p.categoryName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-text-primary">
                        {fmtUSD(p.priceUSD)}
                      </span>
                      {p.originalPriceUSD && p.originalPriceUSD > p.priceUSD && (
                        <span className="ml-1.5 text-xs text-text-secondary line-through">
                          {fmtUSD(p.originalPriceUSD)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.inStock ? (
                        <span className="inline-flex items-center rounded-badge bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary-dark">
                          In stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-badge bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                          Out of stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const autoNew =
                          !p.hideNewBadge &&
                          Date.now() - new Date(p.createdAt).getTime() <= FOURTEEN_DAYS_MS;
                        const hasAny = autoNew || p.badge;
                        return hasAny ? (
                          <div className="flex flex-wrap gap-1">
                            {autoNew && (
                              <span className="inline-flex items-center rounded-badge bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary-dark">
                                NEW
                              </span>
                            )}
                            {p.badge && (
                              <span className="inline-flex items-center rounded-badge bg-text-primary/5 px-2.5 py-0.5 text-xs font-semibold text-text-primary">
                                {p.badge}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-secondary">—</span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          aria-label={`Edit ${p.name}`}
                          className="rounded-button p-2 text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil size={16} />
                        </Link>
                        <DeleteProductButton id={p.id} name={p.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
