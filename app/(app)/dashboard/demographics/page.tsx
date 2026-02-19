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
  PieChart,
  Pie,
} from "recharts";
import { useDemographics, useNewVoterStats } from "@/lib/hooks/use-demographics";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Sparkles } from "lucide-react";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

const AGE_ORDER = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+", "Unknown"];
const AGE_COLORS: Record<string, string> = {
  "Under 18": "#94a3b8",
  "18-24": "#60a5fa",
  "25-34": "#06b6d4",
  "35-44": "#14b8a6",
  "45-54": "#f59e0b",
  "55-64": "#f97316",
  "65+": "#f43f5e",
  "Unknown": "#d1d5db",
};

const TOOLTIP_STYLE = { fontSize: 13, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "8px 12px" };
const truncate = (s: string, max: number) => s.length > max ? s.slice(0, max - 1) + "…" : s;

const NEW_VOTER_AGE_COLORS: Record<number, string> = {
  18: "#60a5fa",
  19: "#38bdf8",
  20: "#06b6d4",
};

export default function DemographicsPage() {
  const { data: demo, isLoading } = useDemographics();
  const { data: newVoters } = useNewVoterStats();

  if (isLoading || !demo) {
    return <DashboardSkeleton statCount={3} />;
  }

  const malePercent = demo.TotalVoters > 0 ? Math.round((demo.BySex.Male / demo.TotalVoters) * 100) : 0;
  const femalePercent = demo.TotalVoters > 0 ? Math.round((demo.BySex.Female / demo.TotalVoters) * 100) : 0;

  const genderData = [
    { name: "Male", value: demo.BySex.Male, color: "#3b82f6" },
    { name: "Female", value: demo.BySex.Female, color: "#ec4899" },
  ];

  const sortedAgeGroups = [...demo.ByAgeGroup]
    .sort((a, b) => AGE_ORDER.indexOf(a.AgeGroup) - AGE_ORDER.indexOf(b.AgeGroup))
    .map((g) => ({
      name: g.AgeGroup,
      count: g.Count,
      pct: ((g.Count / demo.TotalVoters) * 100).toFixed(1),
      color: AGE_COLORS[g.AgeGroup] ?? "#9ca3af",
    }));

  const islandData = (demo.ByIsland ?? []).map((i) => ({
    name: truncate(i.IslandName || "Unknown", 18),
    fullName: i.IslandName || "Unknown",
    count: i.Count,
    pct: ((i.Count / demo.TotalVoters) * 100).toFixed(1),
  }));

  const constData = (demo.ByConstituency ?? []).map((c) => ({
    name: truncate(c.ConstituencyName || "Unknown", 18),
    fullName: c.ConstituencyName || "Unknown",
    count: c.Count,
    pct: ((c.Count / demo.TotalVoters) * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Total Voters" value={demo.TotalVoters.toLocaleString()} icon={Users} />
        <StatCard title="Male" value={demo.BySex.Male.toLocaleString()} description={`${malePercent}% of voters`} />
        <StatCard title="Female" value={demo.BySex.Female.toLocaleString()} description={`${femalePercent}% of voters`} />
      </div>

      {/* Gender Pie + Age Bar side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={genderData}
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
                  {genderData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => Number(value).toLocaleString()}
                contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sortedAgeGroups} margin={{ left: 0, right: 4, top: 4, bottom: 4 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, _name: any, props: any) => [
                    `${Number(value).toLocaleString()} (${props?.payload?.pct ?? ""}%)`,
                    "Voters",
                  ]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {sortedAgeGroups.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
                  formatter={(value: any, _name: any, props: any) => [
                    `${Number(value).toLocaleString()} (${props?.payload?.pct ?? ""}%)`,
                    "Voters",
                  ]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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
                  formatter={(value: any, _name: any, props: any) => [
                    `${Number(value).toLocaleString()} (${props?.payload?.pct ?? ""}%)`,
                    "Voters",
                  ]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* New Voters Section */}
      {newVoters && newVoters.Total > 0 && <NewVotersSection stats={newVoters} totalVoters={demo.TotalVoters} />}
    </div>
  );
}

function NewVotersSection({ stats, totalVoters }: { stats: NonNullable<ReturnType<typeof useNewVoterStats>["data"]>; totalVoters: number }) {
  const pctOfTotal = totalVoters > 0 ? ((stats.Total / totalVoters) * 100).toFixed(1) : "0";
  const malePercent = stats.Total > 0 ? Math.round((stats.BySex.Male / stats.Total) * 100) : 0;
  const femalePercent = stats.Total > 0 ? Math.round((stats.BySex.Female / stats.Total) * 100) : 0;

  const genderData = [
    { name: "Male", value: stats.BySex.Male, color: "#3b82f6" },
    { name: "Female", value: stats.BySex.Female, color: "#ec4899" },
  ];

  const ageData = (stats.ByAge ?? []).map((a) => ({
    name: `Age ${a.Age}`,
    count: a.Count,
    color: NEW_VOTER_AGE_COLORS[a.Age] ?? "#94a3b8",
  }));

  const nvConstData = (stats.ByConstituency ?? []).map((c) => ({
    name: truncate(c.ConstituencyName || "Unknown", 18),
    fullName: c.ConstituencyName || "Unknown",
    count: c.Count,
  }));

  const nvIslandData = (stats.ByIsland ?? []).map((i) => ({
    name: truncate(i.IslandName || "Unknown", 18),
    fullName: i.IslandName || "Unknown",
    count: i.Count,
  }));

  return (
    <>
      {/* Section header */}
      <div className="flex items-center gap-2 pt-2">
        <Sparkles className="h-5 w-5 text-cyan-500" />
        <h2 className="text-lg font-semibold">New Voters (18–20)</h2>
        <span className="text-sm text-muted-foreground">{stats.Total.toLocaleString()} voters · {pctOfTotal}% of total</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="New Voters" value={stats.Total.toLocaleString()} description={`${pctOfTotal}% of all voters`} icon={Sparkles} />
        <StatCard title="Male" value={stats.BySex.Male.toLocaleString()} description={`${malePercent}%`} />
        <StatCard title="Female" value={stats.BySex.Female.toLocaleString()} description={`${femalePercent}%`} />
      </div>

      {/* Gender + Age side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>

      {/* By Constituency + By Island side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {nvConstData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By Constituency</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(nvConstData.length * 42, 160)}>
                <BarChart data={nvConstData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
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

        {nvIslandData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By Island</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(nvIslandData.length * 42, 160)}>
                <BarChart data={nvIslandData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
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
    </>
  );
}
