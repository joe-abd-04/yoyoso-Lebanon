"use client";

// Top 10 best-selling products by units sold (horizontal bars), with the unit
// count and the revenue each generated. Derived from order items, excludes
// cancelled orders.

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { BestSeller } from "@/lib/data/admin-analytics";
import { formatUSD } from "@/lib/formatPrice";
import { ChartCard, TEAL, AXIS, GRID, CountTooltip } from "./chart-ui";

export default function BestSellersChart({ data }: { data: BestSeller[] }) {
  const empty = data.length === 0;
  // Truncate long product names on the axis.
  const chartData = data.map((d) => ({
    ...d,
    short: d.name.length > 22 ? `${d.name.slice(0, 21)}…` : d.name,
  }));
  // Give the chart enough height for all bars.
  const height = Math.max(220, chartData.length * 34 + 20);

  return (
    <ChartCard
      title="Best-selling products"
      subtitle="Top 10 by units sold (excludes cancelled)."
      empty={empty}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            stroke={AXIS}
            tick={{ fontSize: 11, fill: AXIS }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="short"
            width={130}
            stroke={AXIS}
            tick={{ fontSize: 11, fill: AXIS }}
            tickLine={false}
          />
          <Tooltip
            content={<CountTooltip />}
            cursor={{ fill: "rgba(43,196,182,0.08)" }}
          />
          <Bar
            dataKey="quantity"
            name="Units"
            fill={TEAL}
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Revenue per product (the chart shows units; this adds the money). */}
      <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
        {data.map((d, i) => (
          <li
            key={d.slug}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {i + 1}
              </span>
              <span className="truncate text-text-primary">{d.name}</span>
            </span>
            <span className="shrink-0 text-text-secondary">
              <span className="font-semibold text-text-primary">
                {d.quantity}
              </span>{" "}
              units ·{" "}
              <span className="font-semibold text-text-primary">
                {formatUSD(d.revenue)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
