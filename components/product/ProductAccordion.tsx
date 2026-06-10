"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductAccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function ProductAccordion({
  title,
  defaultOpen = false,
  children,
}: ProductAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="font-heading text-base font-bold text-text-primary">
          {title}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-text-secondary transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="pb-4 text-sm text-text-secondary">{children}</div>}
    </div>
  );
}
