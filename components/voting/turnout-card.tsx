"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TurnoutStats } from "@/lib/types";

export function TurnoutCard({ stats }: { stats: TurnoutStats }) {
  const percent = stats.TurnoutPercent;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Turnout</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                className="text-muted"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                className="text-accent"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${percent}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{percent.toFixed(1)}%</span>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Registered</span>
              <span className="font-medium">{stats.TotalRegistered}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Voted</span>
              <span className="font-medium">{stats.TotalVoted}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium">
                {stats.TotalRegistered - stats.TotalVoted}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
