"use client";

// Revenue by top-level product category (horizontal bars). Categories are
// resolved per order item server-side (see lib/data/admin-analytics.ts).

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { CategoryRevenue } from "@/lib/data/admin-analytics";
import { ChartCard, chartColor, AXIS, GRID, MoneyTooltip } from "./chart-ui";

export default function CategoryRevenueChart({
  data,
}: {
  data: CategoryRevenue[];
}) {
  const empty = data.length === 0;
  const chartData = data.map((d) => ({
    ...d,
    short: d.name.length > 20 ? `${d.name.slice(0, 19)}…` : d.name,
  }));
  const height = Math.max(220, chartData.length * 34 + 20);

  return (
    <ChartCard
      title="Revenue by category"
      subtitle="Top-level category, excludes cancelled."
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
            stroke={AXIS}
            tick={{ fontSize: 11, fill: AXIS }}
            tickLine={false}
            tickFormatter={(v: number) => `$${v}`}
          />
          <YAxis
            type="category"
            dataKey="short"
            width={120}
            stroke={AXIS}
            tick={{ fontSize: 11, fill: AXIS }}
            tickLine={false}
          />
          <Tooltip
            content={<MoneyTooltip />}
            cursor={{ fill: "rgba(43,196,182,0.08)" }}
          />
          <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {chartData.map((d, i) => (
              <Cell key={d.name} fill={chartColor(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
