"use client";

import { use, useMemo } from "react";
import Link from "next/link";
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
import { useGroup } from "@/lib/hooks/use-group";
import { useConstituencies } from "@/lib/hooks/use-constituencies";
import { useParties } from "@/lib/hooks/use-parties";
import { useBallotBoxes } from "@/lib/hooks/use-ballot-boxes";
import { useBoxVoters } from "@/lib/hooks/use-ballot-boxes";
import { TurnoutCard } from "@/components/voting/turnout-card";
import { BoxVoterTable } from "@/components/voting/box-voter-table";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSkeleton, CardSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Users } from "lucide-react";
import { useQueryStates, parseAsString } from "nuqs";

const TOOLTIP_STYLE = { fontSize: 13, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "8px 12px" };
const AGE_BUCKETS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "Unknown"] as const;
const AGE_COLORS: Record<string, string> = {
  "18-24": "#60a5fa", "25-34": "#06b6d4", "35-44": "#14b8a6",
  "45-54": "#f59e0b", "55-64": "#f97316", "65+": "#f43f5e", "Unknown": "#d1d5db",
};

const PAGE_SIZE = 50;

interface BoxDetailPageProps {
  params: Promise<{ boxId: string }>;
}

export default function BoxDetailPage({ params }: BoxDetailPageProps) {
  const { boxId } = use(params);

  const [filters, setFilters] = useQueryStates(
    {
      constituency_id: parseAsString.withDefault(""),
      voted: parseAsString.withDefault(""),
      q: parseAsString.withDefault(""),
      page: parseAsString.withDefault(""),
    },
    { shallow: false }
  );

  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: allConstituencies } = useConstituencies();
  const { data: parties } = useParties();

  const groupConstituencyIds = group?.Constituencies ?? [];
  const groupConstituencies = (allConstituencies ?? []).filter((c) =>
    groupConstituencyIds.includes(c.ID)
  );

  const constituencyId = filters.constituency_id || groupConstituencies[0]?.ID || "";
  const activeConstituency = groupConstituencies.find((c) => c.ID === constituencyId);

  const { data: boxes } = useBallotBoxes(constituencyId);
  const currentBox = boxes?.find((b) => b.ID === boxId);

  const page = filters.page ? parseInt(filters.page) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const apiParams: Record<string, string> = {
    offset: String(offset),
    limit: String(PAGE_SIZE),
  };
  if (constituencyId) apiParams.constituency_id = constituencyId;
  if (filters.voted) apiParams.voted = filters.voted;
  if (filters.q) apiParams.q = filters.q;

  const { data: votersResult, isLoading: votersLoading } = useBoxVoters(boxId, apiParams);

  // Fetch all voters for stats (separate query, high limit)
  const { data: allVotersResult } = useBoxVoters(boxId, { limit: "5000", offset: "0" });
  const allVoters = allVotersResult?.Data ?? [];

  const voters = votersResult?.Data ?? [];
  const total = votersResult?.Total ?? 0;
  const limit = votersResult?.Limit ?? PAGE_SIZE;
  const voterOffset = votersResult?.Offset ?? offset;

  // Compute gender stats
  const genderStats = useMemo(() => {
    if (allVoters.length === 0) return null;
    const male = allVoters.filter((v) => v.Sex === "M");
    const female = allVoters.filter((v) => v.Sex === "F");
    return {
      pie: [
        { name: "Male", value: male.length, voted: male.filter((v) => v.HasVoted).length, color: "#3b82f6" },
        { name: "Female", value: female.length, voted: female.filter((v) => v.HasVoted).length, color: "#ec4899" },
      ],
      turnout: [
        { name: "Male", total: male.length, voted: male.filter((v) => v.HasVoted).length, pct: male.length > 0 ? ((male.filter((v) => v.HasVoted).length / male.length) * 100).toFixed(1) : "0" },
        { name: "Female", total: female.length, voted: female.filter((v) => v.HasVoted).length, pct: female.length > 0 ? ((female.filter((v) => v.HasVoted).length / female.length) * 100).toFixed(1) : "0" },
      ],
    };
  }, [allVoters]);

  // Compute age stats
  const ageStats = useMemo(() => {
    if (allVoters.length === 0) return [];
    const buckets: Record<string, { total: number; voted: number }> = {};
    for (const b of AGE_BUCKETS) buckets[b] = { total: 0, voted: 0 };
    for (const v of allVoters) {
      const age = v.Age;
      const bucket = age == null ? "Unknown"
        : age < 25 ? "18-24"
        : age < 35 ? "25-34"
        : age < 45 ? "35-44"
        : age < 55 ? "45-54"
        : age < 65 ? "55-64"
        : "65+";
      buckets[bucket].total++;
      if (v.HasVoted) buckets[bucket].voted++;
    }
    return AGE_BUCKETS.map((b) => ({
      name: b,
      total: buckets[b].total,
      voted: buckets[b].voted,
      color: AGE_COLORS[b],
    })).filter((d) => d.total > 0);
  }, [allVoters]);

  // Compute exit poll stats
  const exitPollStats = useMemo(() => {
    if (allVoters.length === 0) return [];
    const candidates = group?.Candidates ?? [];
    const candMap = Object.fromEntries(candidates.map((c) => [c.ID, c]));
    const counts: Record<string, number> = {};
    for (const v of allVoters) {
      for (const ep of v.ExitPolls ?? []) {
        counts[ep.CandidateID] = (counts[ep.CandidateID] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([id, count]) => ({
        name: candMap[id]?.Name ?? id.slice(0, 8),
        count,
        isOwn: candMap[id]?.IsOwnCandidate ?? false,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allVoters, group]);

  if (groupLoading) {
    return (
      <Page title="Ballot Box" description="Loading...">
        <CardSkeleton />
        <TableSkeleton rows={8} />
      </Page>
    );
  }

  return (
    <Page
      title={currentBox ? `Box ${currentBox.Code}` : "Ballot Box"}
      description={
        <span className="flex items-center gap-2">
          {currentBox?.Location}
          {currentBox?.IsOverseas && (
            <Badge variant="outline" className="text-xs">
              {currentBox.Country || "Overseas"}
            </Badge>
          )}
        </span>
      }
      actions={
        <Link href={`/voting?constituency_id=${constituencyId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
      }
    >
      {currentBox && (
        <TurnoutCard
          total={currentBox.TotalVoters}
          voted={currentBox.VotedCount}
          percent={currentBox.TurnoutPercent}
          totalLabel="Voters"
        />
      )}

      {/* Gender + Age + Exit Poll Charts */}
      {allVoters.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gender Donut */}
          {genderStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gender Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={genderStats.pie}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      dataKey="value"
                      paddingAngle={3}
                      strokeWidth={2}
                      stroke="#fff"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {genderStats.pie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, _name: any, props: any) => [
                        `${Number(value).toLocaleString()} (${props?.payload?.voted ?? 0} voted)`,
                        props?.payload?.name,
                      ]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Age Distribution */}
          {ageStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ageStats} margin={{ left: 0, right: 4, top: 4, bottom: 4 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, name: any, props: any) => [
                        `${Number(value).toLocaleString()}${name === "voted" ? " voted" : ` total (${props?.payload?.voted ?? 0} voted)`}`,
                        name === "voted" ? "Voted" : "Total",
                      ]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Bar dataKey="total" fill="#e5e7eb" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="voted" radius={[6, 6, 0, 0]}>
                      {ageStats.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Exit Poll */}
          {exitPollStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Exit Poll</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={exitPollStats} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [Number(value).toLocaleString(), "Votes"]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {exitPollStats.map((entry, i) => (
                        <Cell key={i} fill={entry.isOwn ? "#22c55e" : "#94a3b8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={filters.voted || "all"}
          onValueChange={(value) => {
            setFilters({ voted: value === "all" ? null : value, page: null });
          }}
          items={{
            all: "All voters",
            true: "Voted",
            false: "Not voted",
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All voters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All voters</SelectItem>
            <SelectItem value="true">Voted</SelectItem>
            <SelectItem value="false">Not voted</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value || null, page: null })}
            className="pl-9"
          />
        </div>
      </div>

      {votersLoading ? (
        <TableSkeleton rows={8} />
      ) : voters.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No voters found"
          description={filters.q ? "Try a different search term." : "No voters match the current filter."}
        />
      ) : (
        <BoxVoterTable
          voters={voters}
          total={total}
          limit={limit}
          offset={voterOffset}
          boxId={boxId}
          constituencyId={constituencyId}
          candidates={group?.Candidates ?? []}
          parties={parties ?? []}
        />
      )}
    </Page>
  );
}
