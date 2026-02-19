"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useOutreachStats } from "@/lib/hooks/use-campaign";
import { useOutreachByDay, useTeamActivity } from "@/lib/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { Phone, Users, CalendarDays, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { outreachMethodLabel, outreachOutcomeLabel } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TOOLTIP_STYLE = { fontSize: 13, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "8px 12px" };

const OUTCOME_COLORS: Record<string, string> = {
  positive: "#22c55e",
  neutral: "#facc15",
  negative: "#ef4444",
  not_home: "#94a3b8",
  refused: "#f97316",
};

function heatBg(count: number, max: number): string {
  if (count === 0) return "bg-muted/50";
  const r = count / max;
  if (r > 0.75) return "bg-green-600 text-white";
  if (r > 0.5) return "bg-green-500 text-white";
  if (r > 0.25) return "bg-green-400 text-green-950";
  return "bg-green-200 text-green-900";
}

export default function OutreachPage() {
  const { data: outreachStats, isLoading } = useOutreachStats();
  const { data: byDay } = useOutreachByDay();
  const { data: teamActivity } = useTeamActivity();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const dayData = byDay ?? [];
  const dayMap = useMemo(() => new Map(dayData.map((d) => [d.Date, d.Count])), [dayData]);

  // Build 30-day calendar grid
  const { calendarWeeks, days30, max30, total30, avg30, best30, streak, weekdayTotals, trend } = useMemo(() => {
    const now = new Date();
    const d30: { date: Date; dateStr: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      d30.push({ date: new Date(d), dateStr: ds, count: dayMap.get(ds) ?? 0 });
    }

    const mx = Math.max(...d30.map((d) => d.count), 1);
    const tot = d30.reduce((s, d) => s + d.count, 0);
    const av = Math.round(tot / 30);

    // Best day
    const bst = d30.reduce((b, d) => (d.count > b.count ? d : b), d30[0]);

    // Current streak
    let strk = 0;
    for (let i = d30.length - 1; i >= 0; i--) {
      if (d30[i].count > 0) strk++;
      else break;
    }

    // Weekday totals
    const wdTotals = [0, 0, 0, 0, 0, 0, 0];
    const wdCounts = [0, 0, 0, 0, 0, 0, 0];
    d30.forEach((d) => {
      const wd = (d.date.getDay() + 6) % 7; // Mon=0
      wdTotals[wd] += d.count;
      wdCounts[wd]++;
    });
    const wdAvg = wdTotals.map((t, i) => (wdCounts[i] > 0 ? Math.round(t / wdCounts[i]) : 0));

    // Trend: first half vs second half
    const firstHalf = d30.slice(0, 15).reduce((s, d) => s + d.count, 0);
    const secondHalf = d30.slice(15).reduce((s, d) => s + d.count, 0);
    const trendVal = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : secondHalf > 0 ? 100 : 0;

    // Build calendar weeks (rows of 7, starting Mon)
    // Pad the beginning to align to Monday
    const firstDay = d30[0].date;
    const firstDow = (firstDay.getDay() + 6) % 7; // Mon=0
    const padded: (typeof d30[0] | null)[] = Array(firstDow).fill(null).concat(d30);
    const weeks: (typeof d30[0] | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      const week = padded.slice(i, i + 7);
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    return { calendarWeeks: weeks, days30: d30, max30: mx, total30: tot, avg30: av, best30: bst, streak: strk, weekdayTotals: wdAvg, trend: trendVal };
  }, [dayMap]);

  if (isLoading) {
    return <DashboardSkeleton statCount={3} />;
  }

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

  // Hovered day info
  const hoveredInfo = hoveredDay ? days30.find((d) => d.dateStr === hoveredDay) : null;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Contacts" value={outreachStats?.TotalContacts ?? 0} icon={Phone} />
        <StatCard title="Unique Reached" value={outreachStats?.UniqueContacted ?? 0} icon={Users} />
        <StatCard title="Last 30 Days" value={total30} icon={CalendarDays} />
        <StatCard
          title="Daily Average"
          value={avg30}
          description={
            trend > 0 ? `+${trend}% vs prior` : trend < 0 ? `${trend}% vs prior` : "Steady"
          }
          icon={trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus}
        />
      </div>

      {/* Advanced 30-Day Heatmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Contact Activity (Last 30 Days)</CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {streak > 0 && (
                <span className="font-medium text-green-600">{streak}-day streak</span>
              )}
              {best30.count > 0 && (
                <span>
                  Best: <span className="font-medium text-foreground">{best30.count}</span> on{" "}
                  {best30.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* GitHub-style heatmap: weekday labels on left, weeks as columns */}
          <div className="overflow-x-auto">
            <div className="inline-flex gap-[3px]">
              <div className="flex flex-col gap-[3px] mr-1">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="h-[14px] flex items-center">
                    <span className="text-[9px] text-muted-foreground w-6">{label}</span>
                  </div>
                ))}
              </div>
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => {
                    if (!day) {
                      return <div key={di} className="w-[14px] h-[14px]" />;
                    }
                    return (
                      <div
                        key={di}
                        className={`w-[14px] h-[14px] rounded-[2px] ${heatBg(day.count, max30).split(" ")[0]}`}
                        title={`${day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}: ${day.count} contacts`}
                        onMouseEnter={() => setHoveredDay(day.dateStr)}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar: legend + hovered detail */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span>Less</span>
              <div className="w-[14px] h-[14px] rounded-[2px] bg-muted/50" />
              <div className="w-[14px] h-[14px] rounded-[2px] bg-green-200" />
              <div className="w-[14px] h-[14px] rounded-[2px] bg-green-400" />
              <div className="w-[14px] h-[14px] rounded-[2px] bg-green-500" />
              <div className="w-[14px] h-[14px] rounded-[2px] bg-green-600" />
              <span>More</span>
            </div>
            {hoveredInfo ? (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {hoveredInfo.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                {" — "}
                <span className="font-semibold text-foreground">{hoveredInfo.count}</span> contacts
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Hover for details
              </div>
            )}
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
              <ResponsiveContainer width="100%" height={Math.max(methodData.length * 42, 140)}>
                <BarChart data={methodData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [Number(value).toLocaleString(), "Contacts"]}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
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
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    dataKey="value"
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="#fff"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {outcomeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [Number(value).toLocaleString(), "Contacts"]}
                    contentStyle={TOOLTIP_STYLE}
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
            <ResponsiveContainer width="100%" height={Math.max(team.length * 48, 140)}>
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
                margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={TOOLTIP_STYLE}
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
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
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
