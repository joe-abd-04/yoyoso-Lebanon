"use client";

// Orders over time, with a daily / weekly / monthly granularity toggle. Orders
// is a teal line. Handles empty data gracefully. (Revenue is shown as a single
// range-driven stat card on the page, not as a chart.)

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type {
  AnalyticsTimeSeries,
  Granularity,
} from "@/lib/data/admin-analytics";
import { CountTooltip, TEAL_DARK, AXIS, GRID } from "./chart-ui";

const TABS: { key: Granularity; label: string }[] = [
  { key: "day", label: "Daily" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
];

const axisProps = {
  stroke: AXIS,
  tick: { fontSize: 11, fill: AXIS },
  tickLine: false,
};

export default function TimeSeriesSection({
  series,
}: {
  series: AnalyticsTimeSeries;
}) {
  const [granularity, setGranularity] = useState<Granularity>("day");
  const data = series[granularity];
  const empty = data.length === 0;

  // Keep label clutter down for dense daily ranges.
  const tickInterval = data.length > 14 ? Math.ceil(data.length / 12) : 0;

  return (
    <div className="rounded-card border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-text-primary">
            Orders over time
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            Count of orders placed in each period.
          </p>
        </div>
        <div className="inline-flex rounded-button border border-border bg-surface p-0.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setGranularity(t.key)}
              className={`rounded-button px-3 py-1.5 text-xs font-semibold transition-colors ${
                granularity === t.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {empty ? (
        <div className="flex h-64 items-center justify-center text-sm text-text-secondary">
          No orders in this range yet.
        </div>
      ) : (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis
                dataKey="label"
                interval={tickInterval}
                {...axisProps}
              />
              <YAxis
                width={36}
                allowDecimals={false}
                {...axisProps}
              />
              <Tooltip
                content={<CountTooltip />}
                cursor={{ stroke: TEAL_DARK, strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                name="Orders"
                stroke={TEAL_DARK}
                strokeWidth={2.5}
                dot={{ r: 3, fill: TEAL_DARK }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
