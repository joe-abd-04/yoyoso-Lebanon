// Presentational card wrapper for a settings section. No hooks — safe to render
// inside the client settings forms.

import type { ReactNode } from "react";

export default function SettingsCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
        )}
        <div>
          <h2 className="font-heading text-lg font-bold text-text-primary">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-text-secondary">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

// ── Shared field helpers (kept here so all settings forms stay consistent) ──────

export function fieldClass(hasError = false): string {
  return [
    "w-full rounded-button border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
    hasError ? "border-red-400" : "border-border focus:border-primary",
  ].join(" ");
}

export function FieldError({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{msg}</p>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-sm font-medium text-text-primary">
      {children}
    </label>
  );
}

export function SaveButton({
  pending,
  children = "Save changes",
}: {
  pending: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-button bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
