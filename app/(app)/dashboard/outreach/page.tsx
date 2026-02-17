"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useOutreachStats } from "@/lib/hooks/use-campaign";
import { useOutreachByDay, useTeamActivity } from "@/lib/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { Phone, Users, CalendarDays } from "lucide-react";
import { outreachMethodLabel, outreachOutcomeLabel } from "@/lib/utils";
import { PageSkeleton } from "@/components/shared/loading-skeleton";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const OUTCOME_COLORS: Record<string, string> = {
  positive: "#22c55e",
  neutral: "#facc15",
  negative: "#ef4444",
  not_home: "#94a3b8",
  refused: "#f97316",
};

function heatmapColor(count: number, max: number): string {
  if (count === 0) return "bg-muted";
  const ratio = count / max;
  if (ratio > 0.75) return "bg-green-600";
  if (ratio > 0.5) return "bg-green-500";
  if (ratio > 0.25) return "bg-green-400";
  return "bg-green-200";
}

export default function OutreachPage() {
  const { data: outreachStats, isLoading } = useOutreachStats();
  const { data: byDay } = useOutreachByDay();
  const { data: teamActivity } = useTeamActivity();

  if (isLoading) {
    return <PageSkeleton />;
  }

  const dayData = byDay ?? [];
  const maxDayCount = Math.max(...dayData.map((d) => d.Count), 1);
  const totalDayContacts = dayData.reduce((sum, d) => sum + d.Count, 0);

  // Heatmap grid
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 90);
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - ((dayOfWeek + 6) % 7));
  const dayMap = new Map(dayData.map((d) => [d.Date, d.Count]));

  const weeks: { date: Date; count: number }[][] = [];
  let currentWeek: { date: Date; count: number }[] = [];
  const cursor = new Date(startDate);
  while (cursor <= now) {
    const dateStr = cursor.toISOString().split("T")[0];
    currentWeek.push({ date: new Date(cursor), count: dayMap.get(dateStr) ?? 0 });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  // Method chart data
  const methodData = Object.entries(outreachStats?.ByMethod ?? {})
    .sort(([, a], [, b]) => b - a)
    .map(([method, count]) => ({
      name: outreachMethodLabel(method),
      count,
    }));

  // Outcome pie data
  const outcomeData = Object.entries(outreachStats?.ByOutcome ?? {})
    .sort(([, a], [, b]) => b - a)
    .map(([outcome, count]) => ({
      name: outreachOutcomeLabel(outcome),
      value: count,
      color: OUTCOME_COLORS[outcome] ?? "#6b7280",
    }));

  // Team data
  const team = teamActivity ?? [];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Total Contacts" value={outreachStats?.TotalContacts ?? 0} icon={Phone} />
        <StatCard title="Unique Reached" value={outreachStats?.UniqueContacted ?? 0} icon={Users} />
        <StatCard title="Last 90 Days" value={totalDayContacts} icon={CalendarDays} />
      </div>

      {/* Contact Activity Heatmap (CSS - Recharts doesn't support this natively) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Activity (Last 90 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-flex gap-[3px]">
              <div className="flex flex-col gap-[3px] mr-1">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="h-3 flex items-center">
                    <span className="text-[9px] text-muted-foreground w-6">{label}</span>
                  </div>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={`w-3 h-3 rounded-[2px] ${heatmapColor(day.count, maxDayCount)}`}
                      title={`${day.date.toISOString().split("T")[0]}: ${day.count} contacts`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="w-3 h-3 rounded-[2px] bg-muted" />
            <div className="w-3 h-3 rounded-[2px] bg-green-200" />
            <div className="w-3 h-3 rounded-[2px] bg-green-400" />
            <div className="w-3 h-3 rounded-[2px] bg-green-500" />
            <div className="w-3 h-3 rounded-[2px] bg-green-600" />
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* By Method (Bar) + By Outcome (Pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Method</CardTitle>
          </CardHeader>
          <CardContent>
            {methodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(methodData.length * 35, 120)}>
                <BarChart data={methodData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [Number(value).toLocaleString(), "Contacts"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No outreach data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Outcome</CardTitle>
          </CardHeader>
          <CardContent>
            {outcomeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {outcomeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [Number(value).toLocaleString(), "Contacts"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No outcome data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Activity (stacked bar) */}
      {team.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(team.length * 40, 120)}>
              <BarChart
                data={team.map((t) => ({
                  name: t.ContactedBy,
                  Positive: t.Positive,
                  Neutral: t.Neutral,
                  Negative: t.Negative,
                  total: t.TotalContacts,
                  unique: t.UniqueContacted,
                }))}
                layout="vertical"
                margin={{ left: 0, right: 12, top: 0, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [value, name]}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(label: any) => {
                    const member = team.find((t) => t.ContactedBy === String(label));
                    return member
                      ? `${label} (${member.TotalContacts} contacts, ${member.UniqueContacted} unique)`
                      : String(label);
                  }}
                />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Positive" stackId="a" fill="#22c55e" />
                <Bar dataKey="Neutral" stackId="a" fill="#facc15" />
                <Bar dataKey="Negative" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
