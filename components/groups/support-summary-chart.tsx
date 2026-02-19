"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUPPORT_LEVEL_HEX } from "@/lib/utils";
import type { SupportSummary } from "@/lib/types";

interface SupportSummaryChartProps {
  summary: SupportSummary;
}

const levels = [
  { key: "StrongSupporter" as const, label: "Strong Supporter", color: SUPPORT_LEVEL_HEX.strong_supporter },
  { key: "Leaning" as const, label: "Leaning", color: SUPPORT_LEVEL_HEX.leaning },
  { key: "Undecided" as const, label: "Undecided", color: SUPPORT_LEVEL_HEX.undecided },
  { key: "SoftOpposition" as const, label: "Soft Opposition", color: SUPPORT_LEVEL_HEX.soft_opposition },
  { key: "HardOpposition" as const, label: "Hard Opposition", color: SUPPORT_LEVEL_HEX.hard_opposition },
  { key: "NotAssessed" as const, label: "Not Assessed", color: "#e5e7eb" },
];

export function SupportSummaryChart({ summary }: SupportSummaryChartProps) {
  const total = summary.TotalAssessed + summary.NotAssessed;
  if (total === 0) return null;

  const data = levels.map(({ key, label, color }) => ({
    name: label,
    count: summary[key],
    pct: ((summary[key] / total) * 100).toFixed(1),
    color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Support Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ left: 0, right: 4, top: 4, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _name: any, props: any) => [
                `${Number(value).toLocaleString()} (${props?.payload?.pct ?? ""}%)`,
                "Count",
              ]}
              contentStyle={{ fontSize: 13, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "8px 12px" }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
