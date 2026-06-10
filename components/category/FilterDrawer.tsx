"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import FilterControls from "@/components/category/FilterControls";
import { SORT_OPTIONS, type Filters, type SortKey } from "@/components/category/filters";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  patch: (p: Partial<Filters>) => void;
  resultCount: number;
  onClear: () => void;
}

export default function FilterDrawer({
  open,
  onClose,
  filters,
  patch,
  resultCount,
  onClear,
}: FilterDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            aria-hidden="true"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label="Filter and sort"
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-card bg-white lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-heading text-base font-bold text-text-primary">
                Filter &amp; Sort
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="p-1 text-text-secondary hover:text-primary"
              >
                <X size={22} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-4">
              {/* Sort */}
              <div className="border-b border-border py-4">
                <p className="mb-3 font-heading text-sm font-bold text-text-primary">
                  Sort By
                </p>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => patch({ sort: o.key as SortKey })}
                      className={cn(
                        "rounded-badge border px-3 py-1.5 text-xs font-medium transition-colors",
                        filters.sort === o.key
                          ? "border-primary bg-primary text-white"
                          : "border-border text-text-secondary",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <FilterControls filters={filters} patch={patch} />
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-3 border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={onClear}
                className="text-sm font-semibold text-text-secondary underline"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-button bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
              >
                Show {resultCount} {resultCount === 1 ? "result" : "results"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
