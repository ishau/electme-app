"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { useGroup } from "@/lib/hooks/use-group";
import { useSupportSummary, useOutreachStats, useCandidateSupport } from "@/lib/hooks/use-campaign";
import { useSupportTrend, useSupportByConstituency } from "@/lib/hooks/use-analytics";
import { SupportSummaryChart } from "@/components/groups/support-summary-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { SUPPORT_LEVEL_HEX } from "@/lib/utils";

const SUPPORT_LEVELS = [
  { key: "StrongSupporter" as const, color: SUPPORT_LEVEL_HEX.strong_supporter, label: "Strong" },
  { key: "Leaning" as const, color: SUPPORT_LEVEL_HEX.leaning, label: "Leaning" },
  { key: "Undecided" as const, color: SUPPORT_LEVEL_HEX.undecided, label: "Undecided" },
  { key: "SoftOpposition" as const, color: SUPPORT_LEVEL_HEX.soft_opposition, label: "Soft Opp" },
  { key: "HardOpposition" as const, color: SUPPORT_LEVEL_HEX.hard_opposition, label: "Hard Opp" },
];

export default function CampaignPage() {
  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: supportSummary } = useSupportSummary();
  const { data: outreachStats } = useOutreachStats();
  const { data: candidateSupport } = useCandidateSupport();
  const { data: trend } = useSupportTrend();
  const { data: constSupport } = useSupportByConstituency();

  const allCandidates = group?.Candidates ?? [];
  const candidateMap = Object.fromEntries(allCandidates.map((c) => [c.ID, c]));
  const candidateStats = candidateSupport ?? [];

  if (groupLoading) {
    return <DashboardSkeleton statCount={0} />;
  }

  // Outreach funnel
  const totalVoters = supportSummary
    ? supportSummary.TotalAssessed + supportSummary.NotAssessed
    : 0;
  const contacted = outreachStats?.UniqueContacted ?? 0;
  const assessed = supportSummary?.TotalAssessed ?? 0;
  const supportive =
    (supportSummary?.StrongSupporter ?? 0) + (supportSummary?.Leaning ?? 0);
  const funnelData = [
    { name: "Total Voters", value: totalVoters, color: "#94a3b8" },
    { name: "Contacted", value: contacted, color: "#60a5fa" },
    { name: "Assessed", value: assessed, color: "#fbbf24" },
    { name: "Supportive", value: supportive, color: "#22c55e" },
  ];

  // Support trend data
  const trendData = (trend ?? []).map((pt) => ({
    week: pt.Week.slice(5), // MM-DD
    ...pt,
  }));

  // Constituency comparison: transform for stacked bar
  const constData = (constSupport ?? []).map((c) => ({
    name: c.ConstituencyName,
    ...c,
  }));

  return (
    <div className="space-y-6">
      {/* Row 1: Support Breakdown + Outreach Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {supportSummary && <SupportSummaryChart summary={supportSummary} />}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outreach Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [
                    `${Number(value).toLocaleString()} (${totalVoters > 0 ? ((Number(value) / totalVoters) * 100).toFixed(1) : 0}%)`,
                    "Count",
                  ]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {funnelData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Support Trend (stacked bar) */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Support Trend (Last 12 Weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trendData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 11 }}
                />
                {SUPPORT_LEVELS.map((lvl) => (
                  <Bar
                    key={lvl.key}
                    dataKey={lvl.key}
                    stackId="a"
                    fill={lvl.color}
                    name={lvl.label}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Row 3: Candidate Support Breakdown */}
      {candidateStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Support by Candidate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(candidateStats.length * 50, 120)}>
              <BarChart
                data={candidateStats.map((cs) => {
                  const cand = candidateMap[cs.CandidateID];
                  return {
                    name: cand?.Name ?? cs.CandidateID.slice(0, 8),
                    ...cs,
                  };
                })}
                layout="vertical"
                margin={{ left: 0, right: 12, top: 0, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                {SUPPORT_LEVELS.map((lvl) => (
                  <Bar
                    key={lvl.key}
                    dataKey={lvl.key}
                    stackId="a"
                    fill={lvl.color}
                    name={lvl.label}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {candidateStats.map((cs) => {
                const cand = candidateMap[cs.CandidateID];
                if (!cand) return null;
                return (
                  <Badge
                    key={cs.CandidateID}
                    variant={cand.IsOwnCandidate ? "default" : "secondary"}
                    className="text-[10px] px-1.5"
                  >
                    #{cand.Number} {cand.Name}
                    {cand.IsOwnCandidate ? " (Ours)" : ""}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 4: Constituency Comparison (stacked bar) */}
      {constData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Support by Constituency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(constData.length * 45, 120)}>
              <BarChart data={constData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                {SUPPORT_LEVELS.map((lvl) => (
                  <Bar
                    key={lvl.key}
                    dataKey={lvl.key}
                    stackId="a"
                    fill={lvl.color}
                    name={lvl.label}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
