"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { deleteProduct } from "@/app/admin/products/actions";
import { useUIStore } from "@/store/uiStore";

export default function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    const result = await deleteProduct(id);
    setBusy(false);
    if (result.ok) {
      setOpen(false);
      showToast("Product deleted.", "success");
      router.refresh();
    } else {
      showToast(result.error, "error");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${name}`}
        className="rounded-button p-2 text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
      >
        <Trash2 size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => !busy && setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-card border border-border bg-white p-6 shadow-xl"
          >
            <button
              type="button"
              onClick={() => !busy && setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-text-secondary hover:text-text-primary"
            >
              <X size={18} />
            </button>

            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <AlertTriangle size={22} />
            </span>
            <h2 className="mt-3 font-heading text-lg font-bold text-text-primary">
              Delete product?
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{name}</span> will
              be permanently removed from your store. This can&apos;t be undone.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="flex-1 rounded-button border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="flex-1 rounded-button bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
