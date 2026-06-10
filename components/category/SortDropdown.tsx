"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS, type SortKey } from "@/components/category/filters";

interface SortDropdownProps {
  value: SortKey;
  onChange: (key: SortKey) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const current = SORT_OPTIONS.find((o) => o.key === value) ?? SORT_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-button border border-border bg-white px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:border-primary"
      >
        <span className="text-text-secondary">Sort:</span>
        {current.label}
        <ChevronDown
          size={15}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-card border border-border bg-white py-1 shadow-lg"
        >
          {SORT_OPTIONS.map((o) => (
            <li key={o.key}>
              <button
                type="button"
                role="option"
                aria-selected={o.key === value}
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-surface",
                  o.key === value
                    ? "font-semibold text-primary"
                    : "text-text-primary",
                )}
              >
                {o.label}
                {o.key === value && <Check size={15} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
