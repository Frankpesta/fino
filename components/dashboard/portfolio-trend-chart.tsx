"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = { label: string; inflow: number; outflow: number };

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function PortfolioTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="bambooInflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#62B97C" stopOpacity={0.36} />
              <stop offset="95%" stopColor="#62B97C" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bambooOutflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D6A057" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#D6A057" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            width={54}
            tickFormatter={money}
            tick={{ fill: "currentColor", fillOpacity: 0.5, fontSize: 11 }}
          />
          <Tooltip
            cursor={{ stroke: "currentColor", strokeOpacity: 0.16 }}
            contentStyle={{
              borderRadius: "14px",
              border: "1px solid rgba(114, 98, 65, 0.18)",
              background: "rgba(28, 42, 30, 0.96)",
              color: "#FCFAF4",
              boxShadow: "0 16px 40px rgba(24, 36, 25, 0.24)",
            }}
            formatter={(value, name) => [money(Number(value ?? 0)), name === "inflow" ? "Inflow" : "Outflow"]}
          />
          <Area type="monotone" dataKey="inflow" stroke="#62B97C" strokeWidth={2.5} fill="url(#bambooInflow)" />
          <Area type="monotone" dataKey="outflow" stroke="#D6A057" strokeWidth={2.25} fill="url(#bambooOutflow)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
