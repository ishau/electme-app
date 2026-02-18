"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _name: any, props: any) => [
                `${value} (${props?.payload?.pct ?? ""}%)`,
                "Count",
              ]}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
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
