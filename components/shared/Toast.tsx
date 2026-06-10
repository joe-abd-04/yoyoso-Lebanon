"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, X } from "lucide-react";
import { useUIStore, type Toast as ToastData, type ToastType } from "@/store/uiStore";

const TOAST_DURATION_MS = 2500;

// success uses #22c55e per spec; others reuse brand/neutral tones.
const TYPE_STYLES: Record<ToastType, string> = {
  success: "bg-[#22c55e]",
  error: "bg-primary",
  info: "bg-text-primary",
};

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") return <Check size={16} />;
  if (type === "error") return <X size={16} />;
  return <Info size={16} />;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
    // Schedule once per toast; onDismiss closure is stable for its lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      role="status"
      className={`pointer-events-auto flex items-center gap-2 rounded-[8px] px-4 py-3 text-sm font-medium text-white shadow-lg ${TYPE_STYLES[toast.type]}`}
    >
      <ToastIcon type={toast.type} />
      <span className="max-w-[260px]">{toast.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-1 text-white/80 transition-colors hover:text-white"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

/** Toast viewport — fixed top-right, stacks vertically, z 9999. */
export default function Toast() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
