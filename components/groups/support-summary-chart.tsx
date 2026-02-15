"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupportSummary } from "@/lib/types";

interface SupportSummaryChartProps {
  summary: SupportSummary;
}

const levels = [
  { key: "StrongSupporter" as const, label: "Strong Supporter", color: "bg-green-500" },
  { key: "Leaning" as const, label: "Leaning", color: "bg-yellow-400" },
  { key: "Undecided" as const, label: "Undecided", color: "bg-gray-400" },
  { key: "SoftOpposition" as const, label: "Soft Opposition", color: "bg-orange-400" },
  { key: "HardOpposition" as const, label: "Hard Opposition", color: "bg-red-500" },
  { key: "NotAssessed" as const, label: "Not Assessed", color: "bg-gray-200" },
];

export function SupportSummaryChart({ summary }: SupportSummaryChartProps) {
  const total = summary.TotalAssessed + summary.NotAssessed;
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Support Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {levels.map(({ key, label, color }) => {
          const count = summary[key];
          const percent = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span className="text-muted-foreground">
                  {count} ({percent.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
