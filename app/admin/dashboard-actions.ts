"use server";

// SERVER ACTION — order count + revenue for a selected date range, used by the
// dashboard's filterable "Orders" card. Admin-verified; the range is resolved
// server-side (same logic as the analytics page) and the aggregation runs in
// the DB layer (getOrdersInRange) — order rows never reach the client.

import { z } from "zod";
import { getAdminUser } from "@/lib/auth/admin";
import { getOrdersInRange } from "@/lib/data/admin-stats";
import { resolveRange, parsePreset } from "@/lib/analytics/range";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const schema = z.object({
  preset: z.string().max(20),
  from: z
    .string()
    .regex(DATE_RE)
    .nullable()
    .optional(),
  to: z
    .string()
    .regex(DATE_RE)
    .nullable()
    .optional(),
});

export type OrdersRangeStats =
  | { ok: true; count: number; revenue: number; label: string }
  | { ok: false; error: string };

export async function getOrdersRangeStats(input: {
  preset: string;
  from?: string | null;
  to?: string | null;
}): Promise<OrdersRangeStats> {
  if (!(await getAdminUser())) {
    return { ok: false, error: "Not authorized." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid date range." };
  }

  // parsePreset + resolveRange handle from > to / invalid custom dates by
  // gracefully falling back to "all time".
  const preset = parsePreset(parsed.data.preset);
  const range = resolveRange(
    preset,
    parsed.data.from ?? null,
    parsed.data.to ?? null,
  );

  const { count, revenue } = await getOrdersInRange(range.startISO, range.endISO);
  return { ok: true, count, revenue, label: range.label };
}
