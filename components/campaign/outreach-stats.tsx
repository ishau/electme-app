"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { outreachMethodLabel, outreachOutcomeLabel } from "@/lib/utils";
import type { OutreachStats } from "@/lib/types";

export function OutreachStatsDisplay({ stats }: { stats: OutreachStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacts by Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(stats.ByMethod || {}).map(([method, count]) => {
            const percent = stats.TotalContacts > 0 ? (count / stats.TotalContacts) * 100 : 0;
            return (
              <div key={method}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{outreachMethodLabel(method)}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
          {Object.keys(stats.ByMethod || {}).length === 0 && (
            <p className="text-sm text-muted-foreground">No contacts yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacts by Outcome</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(stats.ByOutcome || {}).map(([outcome, count]) => {
            const percent = stats.TotalContacts > 0 ? (count / stats.TotalContacts) * 100 : 0;
            const color =
              outcome === "positive"
                ? "bg-green-500"
                : outcome === "neutral"
                  ? "bg-yellow-400"
                  : outcome === "negative"
                    ? "bg-red-500"
                    : "bg-gray-400";
            return (
              <div key={outcome}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{outreachOutcomeLabel(outcome)}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
          {Object.keys(stats.ByOutcome || {}).length === 0 && (
            <p className="text-sm text-muted-foreground">No contacts yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
