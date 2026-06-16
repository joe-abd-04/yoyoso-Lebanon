// Date-range presets for the admin Sales Analytics page.
//
// Framework-free and client-safe (no server-only imports): the client filter
// component (AnalyticsDateFilter) reads the preset list, and the server page
// calls resolveRange() to turn a preset (+ optional custom from/to) into the
// concrete time window the analytics aggregation is scoped to.
//
// NOTE: ranges are computed in SERVER LOCAL time (new Date()), consistent with
// the dashboard's today/this-month boundaries. Acceptable for a single-store
// admin; revisit if the store ever needs per-timezone reporting.

export type AnalyticsPreset =
  | "today"
  | "week"
  | "last7"
  | "last30"
  | "month"
  | "year"
  | "all"
  | "custom";

/** Quick-pick presets shown as buttons (custom range has its own inputs). */
export const ANALYTICS_PRESETS: { key: AnalyticsPreset; label: string }[] = [
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

/** Presets for the dashboard "Orders" card (Today/This week/month/year/all). */
export const DASHBOARD_ORDER_PRESETS: { key: AnalyticsPreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

const PRESET_KEYS = new Set<AnalyticsPreset>([
  "today",
  "week",
  "last7",
  "last30",
  "month",
  "year",
  "all",
  "custom",
]);

/** Coerce an arbitrary query value into a known preset (defaults to "all"). */
export function parsePreset(value: unknown): AnalyticsPreset {
  return typeof value === "string" && PRESET_KEYS.has(value as AnalyticsPreset)
    ? (value as AnalyticsPreset)
    : "all";
}

export interface ResolvedRange {
  preset: AnalyticsPreset;
  /** Inclusive lower bound in epoch ms, or null for "from the beginning". */
  startMs: number | null;
  /** Inclusive upper bound in epoch ms. */
  endMs: number;
  /** ISO strings for the Supabase query (null start = no lower bound). */
  startISO: string | null;
  endISO: string;
  /** Human label for the selected window, e.g. "Last 30 days". */
  label: string;
  /** Echoed back so the UI can re-render the custom inputs. */
  from: string | null;
  to: string | null;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Parse a YYYY-MM-DD string into a local Date, or null if invalid. */
function parseDateInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(year, month, day);
  // Reject overflow (e.g. 2026-02-31 rolling into March).
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

/**
 * Turn a preset (+ optional custom from/to) into a concrete window. Runs on the
 * server in the analytics page. The end bound is always "now" for relative
 * presets so the latest orders are always included.
 */
export function resolveRange(
  preset: AnalyticsPreset,
  from?: string | null,
  to?: string | null,
): ResolvedRange {
  const now = new Date();
  const endMs = now.getTime();
  const todayStart = startOfDay(now);

  const make = (
    startMs: number | null,
    label: string,
    fromOut: string | null = null,
    toOut: string | null = null,
  ): ResolvedRange => ({
    preset,
    startMs,
    endMs,
    startISO: startMs === null ? null : new Date(startMs).toISOString(),
    endISO: new Date(endMs).toISOString(),
    label,
    from: fromOut,
    to: toOut,
  });

  switch (preset) {
    case "today":
      return make(todayStart.getTime(), "Today");
    case "week": {
      // Week starts Monday (local time).
      const start = new Date(todayStart);
      const offset = (start.getDay() + 6) % 7; // days since Monday
      start.setDate(start.getDate() - offset);
      return make(start.getTime(), "This week");
    }
    case "last7": {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 6);
      return make(start.getTime(), "Last 7 days");
    }
    case "last30": {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 29);
      return make(start.getTime(), "Last 30 days");
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return make(start.getTime(), "This month");
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      return make(start.getTime(), "This year");
    }
    case "custom": {
      const startD = parseDateInput(from);
      const endD = parseDateInput(to);
      // Need both ends to be a valid custom range; otherwise fall back to all.
      if (startD && endD && startD.getTime() <= endD.getTime()) {
        const startMs = startOfDay(startD).getTime();
        // Inclusive end-of-day for the "to" date.
        const endOfTo = new Date(
          endD.getFullYear(),
          endD.getMonth(),
          endD.getDate(),
          23,
          59,
          59,
          999,
        );
        const fromStr = from ?? null;
        const toStr = to ?? null;
        return {
          preset: "custom",
          startMs,
          endMs: endOfTo.getTime(),
          startISO: new Date(startMs).toISOString(),
          endISO: endOfTo.toISOString(),
          label: `${fromStr} → ${toStr}`,
          from: fromStr,
          to: toStr,
        };
      }
      return { ...make(null, "All time"), preset: "all" };
    }
    case "all":
    default:
      return make(null, "All time");
  }
}
