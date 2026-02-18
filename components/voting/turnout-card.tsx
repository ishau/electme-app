"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Vote, UserX } from "lucide-react";
import type { TurnoutStats } from "@/lib/types";

export function TurnoutCard({ stats }: { stats: TurnoutStats }) {
  const percent = stats.TurnoutPercent;
  const remaining = stats.TotalRegistered - stats.TotalVoted;

  // Ring parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  // Color based on turnout
  const ringColor =
    percent >= 70 ? "text-green-500" :
    percent >= 40 ? "text-yellow-500" :
    "text-red-400";

  const ringBg =
    percent >= 70 ? "text-green-500/10" :
    percent >= 40 ? "text-yellow-500/10" :
    "text-red-400/10";

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Ring */}
          <div className="relative w-36 h-36 shrink-0">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="currentColor"
                className={ringBg}
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="currentColor"
                className={ringColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold tracking-tight">{percent.toFixed(1)}%</span>
              <span className="text-xs text-muted-foreground">turnout</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 flex-1 w-full">
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-2xl font-bold">{stats.TotalRegistered}</span>
              <span className="text-xs text-muted-foreground">Registered</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-green-500/10">
              <Vote className="h-5 w-5 text-green-600 mb-1" />
              <span className="text-2xl font-bold text-green-600">{stats.TotalVoted}</span>
              <span className="text-xs text-muted-foreground">Voted</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-orange-500/10">
              <UserX className="h-5 w-5 text-orange-500 mb-1" />
              <span className="text-2xl font-bold text-orange-500">{remaining}</span>
              <span className="text-xs text-muted-foreground">Remaining</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{stats.TotalVoted} voted</span>
            <span>{remaining} remaining</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600"
              style={{ width: `${percent}%`, transition: "width 0.6s ease" }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
