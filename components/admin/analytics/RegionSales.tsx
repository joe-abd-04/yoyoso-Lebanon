"use client";

// Sales by region (revenue bar chart) plus a top-cities table. Grouped from the
// order's region/city fields; revenue excludes cancelled orders.

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
import type { RegionSales as RegionRow, CitySales } from "@/lib/data/admin-analytics";
import { formatUSD } from "@/lib/formatPrice";
import { ChartCard, chartColor, AXIS, GRID, MoneyTooltip } from "./chart-ui";

export default function RegionSales({
  regions,
  cities,
}: {
  regions: RegionRow[];
  cities: CitySales[];
}) {
  const empty = regions.length === 0;
  const chartData = regions.map((r) => ({
    ...r,
    short: r.region.length > 16 ? `${r.region.slice(0, 15)}…` : r.region,
  }));
  const height = Math.max(200, chartData.length * 36 + 20);

  return (
    <ChartCard
      title="Sales by region"
      subtitle="Revenue per region; top cities below."
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
            width={110}
            stroke={AXIS}
            tick={{ fontSize: 11, fill: AXIS }}
            tickLine={false}
          />
          <Tooltip
            content={<MoneyTooltip />}
            cursor={{ fill: "rgba(43,196,182,0.08)" }}
          />
          <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {chartData.map((d, i) => (
              <Cell key={d.region} fill={chartColor(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Top cities table */}
      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Top cities
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-secondary">
                <th className="py-1.5 pr-3 font-medium">City</th>
                <th className="py-1.5 pr-3 font-medium">Region</th>
                <th className="py-1.5 pr-3 text-right font-medium">Orders</th>
                <th className="py-1.5 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cities.map((c) => (
                <tr key={`${c.region}-${c.city}`} className="text-text-primary">
                  <td className="py-1.5 pr-3 font-medium">{c.city}</td>
                  <td className="py-1.5 pr-3 text-text-secondary">{c.region}</td>
                  <td className="py-1.5 pr-3 text-right">{c.orders}</td>
                  <td className="py-1.5 text-right font-semibold">
                    {formatUSD(c.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ChartCard>
  );
}
