"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type GrowthPoint = { label: string; newUsers: number };

export function UserGrowthChart({ data }: { data: GrowthPoint[] }) {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            minTickGap={30}
            tick={{ fill: "currentColor", fillOpacity: 0.5, fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={28}
            allowDecimals={false}
            tick={{ fill: "currentColor", fillOpacity: 0.5, fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
            contentStyle={{
              borderRadius: "14px",
              border: "1px solid rgba(114, 98, 65, 0.18)",
              background: "rgba(28, 42, 30, 0.96)",
              color: "#FCFAF4",
              boxShadow: "0 16px 40px rgba(24, 36, 25, 0.24)",
            }}
            formatter={(value) => [`${value}`, "New users"]}
          />
          <Bar dataKey="newUsers" fill="#62B97C" radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
