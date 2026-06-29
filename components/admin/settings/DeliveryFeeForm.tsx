"use client";

import { useState, useTransition } from "react";
import { Truck } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { numberInputGuard } from "@/lib/forms/number-input";
import { updateDeliveryFee } from "@/app/admin/settings/actions";
import SettingsCard, {
  fieldClass,
  FieldError,
  FieldLabel,
  SaveButton,
} from "@/components/admin/settings/SettingsCard";

export default function DeliveryFeeForm({ initialFee }: { initialFee: number }) {
  const [fee, setFee] = useState(String(initialFee));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const showToast = useUIStore((s) => s.showToast);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateDeliveryFee({ fee });
      if (res.ok) {
        showToast("Delivery fee updated.", "success");
      } else {
        setError(res.error);
        showToast(res.error, "error");
      }
    });
  };

  return (
    <SettingsCard
      title="Delivery fee"
      description="Flat delivery charge in USD applied at checkout (free over $30)."
      icon={<Truck size={20} />}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:max-w-xs">
        <div>
          <FieldLabel>Delivery fee (USD)</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              {...numberInputGuard}
              className={`${fieldClass(!!error)} no-spinner pl-7`}
            />
          </div>
          <FieldError msg={error} />
        </div>
        <div>
          <SaveButton pending={pending} />
        </div>
      </form>
    </SettingsCard>
  );
}
