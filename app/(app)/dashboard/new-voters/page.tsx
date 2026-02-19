"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useNewVoterStats } from "@/lib/hooks/use-demographics";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { Users, UserCheck, TrendingUp } from "lucide-react";
import { SUPPORT_LEVEL_HEX } from "@/lib/utils";

const TOOLTIP_STYLE = { fontSize: 13, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "8px 12px" };
const truncate = (s: string, max: number) => s.length > max ? s.slice(0, max - 1) + "\u2026" : s;

const AGE_COLORS: Record<number, string> = {
  18: "#60a5fa",
  19: "#38bdf8",
  20: "#06b6d4",
};

export default function NewVotersPage() {
  const { data: stats, isLoading } = useNewVoterStats();

  if (isLoading || !stats) {
    return <DashboardSkeleton statCount={4} />;
  }

  const malePercent = stats.Total > 0 ? Math.round((stats.BySex.Male / stats.Total) * 100) : 0;
  const femalePercent = stats.Total > 0 ? Math.round((stats.BySex.Female / stats.Total) * 100) : 0;

  const genderData = [
    { name: "Male", value: stats.BySex.Male, color: "#3b82f6" },
    { name: "Female", value: stats.BySex.Female, color: "#ec4899" },
  ];

  const ageData = (stats.ByAge ?? []).map((a) => ({
    name: `Age ${a.Age}`,
    count: a.Count,
    color: AGE_COLORS[a.Age] ?? "#94a3b8",
  }));

  const supportData = stats.SupportBreakdown ? [
    { name: "Strong", value: stats.SupportBreakdown.StrongSupporter, color: SUPPORT_LEVEL_HEX.strong_supporter },
    { name: "Leaning", value: stats.SupportBreakdown.Leaning, color: SUPPORT_LEVEL_HEX.leaning },
    { name: "Undecided", value: stats.SupportBreakdown.Undecided, color: SUPPORT_LEVEL_HEX.undecided },
    { name: "Soft Opp", value: stats.SupportBreakdown.SoftOpposition, color: SUPPORT_LEVEL_HEX.soft_opposition },
    { name: "Hard Opp", value: stats.SupportBreakdown.HardOpposition, color: SUPPORT_LEVEL_HEX.hard_opposition },
  ].filter((d) => d.value > 0) : [];

  const assessed = stats.SupportBreakdown?.Assessed ?? 0;
  const supportive = (stats.SupportBreakdown?.StrongSupporter ?? 0) + (stats.SupportBreakdown?.Leaning ?? 0);
  const supportivePct = assessed > 0 ? ((supportive / assessed) * 100).toFixed(1) : "0";
  const assessedPct = stats.Total > 0 ? ((assessed / stats.Total) * 100).toFixed(1) : "0";

  const constData = (stats.ByConstituency ?? []).map((c) => ({
    name: truncate(c.ConstituencyName || "Unknown", 18),
    fullName: c.ConstituencyName || "Unknown",
    count: c.Count,
  }));

  const islandData = (stats.ByIsland ?? []).map((i) => ({
    name: truncate(i.IslandName || "Unknown", 18),
    fullName: i.IslandName || "Unknown",
    count: i.Count,
  }));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="New Voters (18–20)" value={stats.Total.toLocaleString()} icon={Users} />
        <StatCard title="Male" value={stats.BySex.Male.toLocaleString()} description={`${malePercent}%`} />
        <StatCard title="Female" value={stats.BySex.Female.toLocaleString()} description={`${femalePercent}%`} />
        <StatCard title="Assessed" value={assessed.toLocaleString()} description={`${assessedPct}% of new voters`} icon={UserCheck} />
      </div>

      {/* Row: Gender Donut + Age Breakdown + Support Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gender Split</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  paddingAngle={3}
                  strokeWidth={2}
                  stroke="#fff"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {genderData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [Number(value).toLocaleString(), "Voters"]}
                  contentStyle={TOOLTIP_STYLE}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Age Breakdown (18, 19, 20) */}
        {ageData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By Age</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={ageData} margin={{ left: 0, right: 4, top: 4, bottom: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [Number(value).toLocaleString(), "Voters"]}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {ageData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Support Donut */}
        {supportData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Support Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={supportData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="#fff"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {supportData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [Number(value).toLocaleString(), "Voters"]}
                    contentStyle={TOOLTIP_STYLE}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center text-sm text-muted-foreground mt-1">
                {supportive.toLocaleString()} supportive ({supportivePct}%)
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Support Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No new voters assessed yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* By Constituency */}
      {constData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Constituency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(constData.length * 42, 160)}>
              <BarChart data={constData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(_label: any, payload: any) => payload?.[0]?.payload?.fullName ?? _label}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [Number(value).toLocaleString(), "New Voters"]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* By Island */}
      {islandData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Island</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(islandData.length * 42, 160)}>
              <BarChart data={islandData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(_label: any, payload: any) => payload?.[0]?.payload?.fullName ?? _label}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [Number(value).toLocaleString(), "New Voters"]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
