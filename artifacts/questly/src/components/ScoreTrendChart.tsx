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

export default function ScoreTrendChart({
  data,
}: {
  data: Array<{ attempt: number; percentage: number; date: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(262, 72%, 58%)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(262, 72%, 58%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="attempt"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value: number) => [`${value}%`, "Score"]}
          labelFormatter={(label: number) => `Attempt ${label}`}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="percentage"
          stroke="hsl(262, 72%, 58%)"
          strokeWidth={2}
          fill="url(#scoreFill)"
          dot={{ r: 3, fill: "hsl(262, 72%, 58%)" }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
