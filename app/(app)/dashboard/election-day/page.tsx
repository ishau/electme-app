"use client";

import { useState } from "react";
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
} from "recharts";
import { useTransportStats } from "@/lib/hooks/use-transport";
import { useTurnout } from "@/lib/hooks/use-voting";
import { useDemographics } from "@/lib/hooks/use-demographics";
import { useGroup } from "@/lib/hooks/use-group";
import { useConstituencies } from "@/lib/hooks/use-constituencies";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, Vote, Users, Clock } from "lucide-react";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

const TRANSPORT_SEGMENTS = [
  { key: "Pending" as const, label: "Pending", color: "#facc15" },
  { key: "Arranged" as const, label: "Arranged", color: "#3b82f6" },
  { key: "Completed" as const, label: "Completed", color: "#22c55e" },
  { key: "Cancelled" as const, label: "Cancelled", color: "#94a3b8" },
];

export default function ElectionDayPage() {
  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: demo } = useDemographics();
  const { data: transportStats } = useTransportStats();
  const { data: constituencies } = useConstituencies();

  const groupConstituencies = group?.Constituencies ?? [];
  const availableConstituencies = (constituencies ?? []).filter((c) =>
    groupConstituencies.includes(c.ID)
  );
  const [selectedConstituency, setSelectedConstituency] = useState("");
  const firstConst = availableConstituencies[0]?.ID ?? "";
  const activeConstituency = selectedConstituency || firstConst;
  const { data: turnout } = useTurnout(activeConstituency);

  if (groupLoading) {
    return <DashboardSkeleton statCount={4} />;
  }

  const totalVoters = demo?.TotalVoters ?? 0;
  const totalTransport = transportStats?.Total ?? 0;

  // Transport donut data
  const transportPieData = TRANSPORT_SEGMENTS.map((seg) => ({
    name: seg.label,
    value: transportStats?.[seg.key] ?? 0,
    color: seg.color,
  })).filter((s) => s.value > 0);

  // Turnout by hour bar chart data
  const votedByHour = turnout?.VotedByHour ?? {};
  const hourData = Object.entries(votedByHour)
    .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Voters" value={totalVoters.toLocaleString()} icon={Users} />
        <StatCard
          title="Transport Requests"
          value={totalTransport}
          description={`${transportStats?.InterIslandNeeded ?? 0} inter-island`}
          icon={Bus}
        />
        <StatCard
          title="Turnout"
          value={turnout ? `${turnout.TurnoutPercent.toFixed(1)}%` : "\u2014"}
          description={
            turnout
              ? `${turnout.TotalVoted} / ${turnout.TotalRegistered}`
              : "Select constituency"
          }
          icon={Vote}
        />
        <StatCard
          title="Service Provided"
          value={transportStats?.ServiceProvided ?? 0}
          description={
            transportStats?.ServiceDenied
              ? `${transportStats.ServiceDenied} denied`
              : undefined
          }
          icon={Clock}
        />
      </div>

      {/* Transport Donut + Registration Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transport Status</CardTitle>
          </CardHeader>
          <CardContent>
            {transportPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={transportPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {transportPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [Number(value).toLocaleString(), "Requests"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No transport data yet.</p>
            )}
            {(transportStats?.InterIslandNeeded ?? 0) > 0 && (
              <div className="flex gap-4 text-xs text-muted-foreground mt-2 justify-center">
                <span>Inter-island: {transportStats!.InterIslandNeeded}</span>
                <span>Voting-day: {transportStats!.VotingDayNeeded}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registration Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {turnout && totalVoters > 0 ? (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span>Registered for Ballot Boxes</span>
                    <span className="text-muted-foreground tabular-nums">
                      {turnout.TotalRegistered.toLocaleString()} / {totalVoters.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min((turnout.TotalRegistered / totalVoters) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((turnout.TotalRegistered / totalVoters) * 100).toFixed(1)}% registered
                    {activeConstituency ? " in selected constituency" : ""}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span>Voted</span>
                    <span className="text-muted-foreground tabular-nums">
                      {turnout.TotalVoted.toLocaleString()} / {turnout.TotalRegistered.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${turnout.TurnoutPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {turnout.TurnoutPercent.toFixed(1)}% turnout
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {activeConstituency
                  ? "No registration data for this constituency."
                  : "Select a constituency to view registration progress."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Turnout by Hour */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Voter Turnout by Hour</CardTitle>
          <select
            className="text-sm border rounded px-2 py-1 bg-background"
            value={activeConstituency}
            onChange={(e) => setSelectedConstituency(e.target.value)}
          >
            {availableConstituencies.map((c) => (
              <option key={c.ID} value={c.ID}>
                {c.Name}
              </option>
            ))}
            {availableConstituencies.length === 0 && (
              <option value="">No constituencies</option>
            )}
          </select>
        </CardHeader>
        <CardContent>
          {hourData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [`${value} votes`, "Votes"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="text-xs text-muted-foreground text-right mt-1">
                Total: {turnout?.TotalVoted ?? 0} votes ({turnout?.TurnoutPercent.toFixed(1)}% turnout)
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {activeConstituency
                ? "No votes recorded yet for this constituency."
                : "Select a constituency to view turnout data."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
