"use client";

import { useState, useTransition } from "react";
import { Tag } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { updatePromo } from "@/app/admin/settings/actions";
import { numberInputGuard } from "@/lib/forms/number-input";
import type { PromoConfig, PromoType } from "@/lib/settings/shared";
import SettingsCard, {
  fieldClass,
  FieldError,
  FieldLabel,
  SaveButton,
} from "@/components/admin/settings/SettingsCard";

export default function PromoForm({
  initial,
}: {
  initial: PromoConfig | null;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [type, setType] = useState<PromoType>(initial?.type ?? "percent");
  const [value, setValue] = useState(
    initial && initial.value ? String(initial.value) : "",
  );
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const showToast = useUIStore((s) => s.showToast);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updatePromo({ code, type, value, enabled });
      if (res.ok) {
        showToast("Promo code saved.", "success");
      } else {
        setError(res.error);
        showToast(res.error, "error");
      }
    });
  };

  return (
    <SettingsCard
      title="Promo / discount code"
      description="One active code customers can apply at checkout. Disable to turn it off without deleting."
      icon={<Tag size={20} />}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Code</FieldLabel>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10"
              maxLength={40}
              className={`${fieldClass(!!error)} uppercase`}
            />
          </div>
          <div>
            <FieldLabel>Discount type</FieldLabel>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PromoType)}
              className={fieldClass()}
            >
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed amount (USD)</option>
            </select>
          </div>
        </div>

        <div className="sm:max-w-xs">
          <FieldLabel>
            {type === "percent" ? "Discount (%)" : "Discount (USD)"}
          </FieldLabel>
          <div className="relative">
            {type === "fixed" && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                $
              </span>
            )}
            <input
              type="number"
              inputMode="decimal"
              step={type === "percent" ? "1" : "0.01"}
              min="0"
              max={type === "percent" ? "100" : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              {...numberInputGuard}
              className={`${fieldClass(!!error)} no-spinner ${type === "fixed" ? "pl-7" : ""}`}
            />
            {type === "percent" && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                %
              </span>
            )}
          </div>
          <FieldError msg={error} />
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm font-medium text-text-primary">
            Enable this promo code
          </span>
          <span
            className={`ml-auto rounded-badge px-2 py-0.5 text-xs font-bold ${
              enabled
                ? "bg-green-100 text-green-700"
                : "bg-surface text-text-secondary"
            }`}
          >
            {enabled ? "Active" : "Disabled"}
          </span>
        </label>

        <div>
          <SaveButton pending={pending} />
        </div>
      </form>
    </SettingsCard>
  );
}
