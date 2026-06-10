"use client";

// Order-status breakdown as a donut, with a labelled legend + counts beside it.

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import type { StatusSlice } from "@/lib/data/admin-analytics";
import { ChartCard, STATUS_COLORS, CountTooltip } from "./chart-ui";

function colorFor(status: string): string {
  return STATUS_COLORS[status] ?? "#94a3b8";
}

export default function StatusDonut({ data }: { data: StatusSlice[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const empty = total === 0;

  return (
    <ChartCard
      title="Order status"
      subtitle="All orders in the selected range."
      empty={empty}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.status} fill={colorFor(d.status)} />
                ))}
              </Pie>
              <Tooltip content={<CountTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-2xl font-extrabold text-text-primary">
              {total}
            </span>
            <span className="text-[11px] text-text-secondary">orders</span>
          </div>
        </div>

        <ul className="w-full flex-1 space-y-2">
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
            return (
              <li
                key={d.status}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="flex items-center gap-2 text-text-primary">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: colorFor(d.status) }}
                  />
                  {d.label}
                </span>
                <span className="font-semibold text-text-primary">
                  {d.count}
                  <span className="ml-1 text-xs font-normal text-text-secondary">
                    ({pct}%)
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </ChartCard>
  );
}
