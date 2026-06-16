"use client";

// Date-range filter for the analytics page. Thin URL-driven wrapper around the
// shared <DateRangeControl>: selecting a preset/custom range pushes
// ?range=...&from=...&to=... so the server page re-reads them and re-aggregates.

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ANALYTICS_PRESETS, type AnalyticsPreset } from "@/lib/analytics/range";
import DateRangeControl from "@/components/admin/DateRangeControl";

export default function AnalyticsDateFilter({
  preset,
  from,
  to,
}: {
  preset: AnalyticsPreset;
  from: string | null;
  to: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const onSelect = (next: string, f?: string, t?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", next);
    if (next === "custom" && f && t) {
      params.set("from", f);
      params.set("to", t);
    } else {
      params.delete("from");
      params.delete("to");
    }
    startTransition(() => {
      router.push(`/admin/analytics?${params.toString()}`);
    });
  };

  return (
    <DateRangeControl
      presets={ANALYTICS_PRESETS}
      preset={preset}
      from={from}
      to={to}
      onSelect={onSelect}
      disabled={isPending}
    />
  );
}
