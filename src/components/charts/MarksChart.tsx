"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DataPoint {
  name: string;
  avg: number;
  max: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: DataPoint }> }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const pct = d.max > 0 ? Math.round((d.avg / d.max) * 100) : 0;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
        <p className="font-semibold text-slate-700">{d.name}</p>
        <p className="text-slate-500">Avg: <span className="font-bold text-violet-600">{d.avg}</span> / {d.max}</p>
        <p className="text-slate-400">{pct}%</p>
      </div>
    );
  }
  return null;
};

export default function MarksChart({ data }: { data: DataPoint[] }) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 9, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
        <Bar dataKey="avg" radius={[4, 4, 0, 0]} maxBarSize={32}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill="#8b5cf6" fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
