"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useDemographics } from "@/lib/hooks/use-demographics";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
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

export default function DemographicsPage() {
  const { data: demo, isLoading } = useDemographics();

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
    name: i.IslandName || "Unknown",
    count: i.Count,
    pct: ((i.Count / demo.TotalVoters) * 100).toFixed(1),
  }));

  const constData = (demo.ByConstituency ?? []).map((c) => ({
    name: c.ConstituencyName || "Unknown",
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
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {genderData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => Number(value).toLocaleString()} />
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
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sortedAgeGroups} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, _name: any, props: any) => [
                    `${Number(value).toLocaleString()} (${props?.payload?.pct ?? ""}%)`,
                    "Voters",
                  ]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
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
            <ResponsiveContainer width="100%" height={Math.max(islandData.length * 30, 120)}>
              <BarChart data={islandData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, _name: any, props: any) => [
                    `${Number(value).toLocaleString()} (${props?.payload?.pct ?? ""}%)`,
                    "Voters",
                  ]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
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
            <ResponsiveContainer width="100%" height={Math.max(constData.length * 30, 120)}>
              <BarChart data={constData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, _name: any, props: any) => [
                    `${Number(value).toLocaleString()} (${props?.payload?.pct ?? ""}%)`,
                    "Voters",
                  ]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
