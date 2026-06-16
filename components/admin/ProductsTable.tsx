"use client";

// Admin products table with row selection + a bulk "Delete selected" action,
// mirroring the orders table UX. Checkboxes select individual products (plus a
// select-all-on-this-page header checkbox). When any row is selected, a bar
// appears with a Delete action that confirms first, then runs the
// admin-verified bulkDeleteProducts server action (which also cleans up each
// product's Storage images), refreshes, and clears the selection.
//
// Per-row Edit / Duplicate / single Delete are unchanged from before.

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Copy, Trash2, Loader2, X } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { bulkDeleteProducts } from "@/app/admin/products/actions";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import type { AdminProductListItem } from "@/lib/data/admin-products";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function fmtUSD(n: number): string {
  return `$${n.toFixed(2)}`;
}

export default function ProductsTable({
  items,
}: {
  items: AdminProductListItem[];
}) {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pageIds = useMemo(() => items.map((p) => p.id), [items]);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const everySelected = pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (everySelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });

  const clearSelection = () => setSelected(new Set());

  const runDelete = () => {
    if (isPending) return;
    const ids = [...selected];
    startTransition(async () => {
      const result = await bulkDeleteProducts(ids);
      if (result.ok) {
        showToast(
          `${result.count} product${result.count !== 1 ? "s" : ""} deleted.`,
          "success",
        );
        clearSelection();
        setConfirmDelete(false);
        router.refresh();
      } else {
        showToast(result.error, "error");
      }
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
              onClick={() => setConfirmDelete(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-button border border-border bg-white px-3 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
            >
              <Trash2 size={15} />
              Delete selected
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
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-xs uppercase tracking-wide text-text-secondary">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all products on this page"
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Badge</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const checked = selected.has(p.id);
                const autoNew =
                  !p.hideNewBadge &&
                  Date.now() - new Date(p.createdAt).getTime() <= FOURTEEN_DAYS_MS;
                const hasAnyBadge = autoNew || p.badge;
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-border last:border-0 hover:bg-surface/60 ${
                      checked ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(p.id)}
                        aria-label={`Select ${p.name}`}
                        className="h-4 w-4 cursor-pointer accent-primary"
                      />
                    </td>
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
                      {hasAnyBadge ? (
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
                      )}
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
                        <Link
                          href={`/admin/products/new?from=${p.id}`}
                          aria-label={`Duplicate ${p.name}`}
                          title="Duplicate"
                          className="rounded-button p-2 text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <Copy size={16} />
                        </Link>
                        <DeleteProductButton id={p.id} name={p.name} />
                      </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                  Delete {selected.size} product{selected.size !== 1 ? "s" : ""}?
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  This permanently removes the selected products and their images.
                  This action cannot be undone.
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
                {isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                Delete products
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
