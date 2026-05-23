"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export function MetricChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="metric-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }} />
        <Area type="monotone" dataKey="value" stroke="#38BDF8" strokeWidth={2} fill="url(#metric-fill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
