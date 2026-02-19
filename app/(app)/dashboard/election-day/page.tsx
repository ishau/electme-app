"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useTransportStats } from "@/lib/hooks/use-transport";
import { useTurnout } from "@/lib/hooks/use-voting";
import { useGroup } from "@/lib/hooks/use-group";
import { useConstituencies } from "@/lib/hooks/use-constituencies";
import { TurnoutCard } from "@/components/voting/turnout-card";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bus, Clock } from "lucide-react";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

const TRANSPORT_SEGMENTS = [
  { key: "Pending" as const, label: "Pending", color: "#facc15" },
  { key: "Arranged" as const, label: "Arranged", color: "#3b82f6" },
  { key: "Completed" as const, label: "Completed", color: "#22c55e" },
  { key: "Cancelled" as const, label: "Cancelled", color: "#94a3b8" },
];

const TOOLTIP_STYLE = { fontSize: 13, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "8px 12px" };

export default function ElectionDayPage() {
  const { data: group, isLoading: groupLoading } = useGroup();
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
      {/* Constituency selector */}
      {availableConstituencies.length > 1 && (
        <Select
          value={activeConstituency}
          onValueChange={(value) => { if (value) setSelectedConstituency(value); }}
          items={Object.fromEntries(availableConstituencies.map((c) => [c.ID, c.Name]))}
        >
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="Select constituency" />
          </SelectTrigger>
          <SelectContent>
            {availableConstituencies.map((c) => (
              <SelectItem key={c.ID} value={c.ID}>
                {c.Name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Voter Turnout */}
      {turnout && (
        <TurnoutCard
          total={turnout.TotalConstituents}
          voted={turnout.TotalVoted}
          percent={turnout.TurnoutPercent}
        />
      )}

      {/* Transport + Turnout by Hour */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transport Status</CardTitle>
          </CardHeader>
          <CardContent>
            {transportPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={transportPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    dataKey="value"
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="#fff"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {transportPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [Number(value).toLocaleString(), "Requests"]}
                    contentStyle={TOOLTIP_STYLE}
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

        {/* Turnout by Hour */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Voter Turnout by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            {hourData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={hourData} margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [`${value} votes`, "Votes"]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-muted-foreground text-right mt-1">
                  Total: {turnout?.TotalVoted ?? 0} votes ({turnout?.TurnoutPercent.toFixed(1)}% turnout)
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No votes recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Transport Requests"
          value={totalTransport}
          description={`${transportStats?.InterIslandNeeded ?? 0} inter-island`}
          icon={Bus}
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
    </div>
  );
}
