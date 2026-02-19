"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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

const TOOLTIP_STYLE = { fontSize: 13, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "8px 12px" };
const truncate = (s: string, max: number) => s.length > max ? s.slice(0, max - 1) + "…" : s;

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
    name: truncate(c.ConstituencyName, 18),
    fullName: c.ConstituencyName,
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
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [
                    `${Number(value).toLocaleString()} (${totalVoters > 0 ? ((Number(value) / totalVoters) * 100).toFixed(1) : 0}%)`,
                    "Count",
                  ]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
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
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData} margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
                {SUPPORT_LEVELS.map((lvl) => (
                  <Line
                    key={lvl.key}
                    type="monotone"
                    dataKey={lvl.key}
                    stroke={lvl.color}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: lvl.color }}
                    activeDot={{ r: 5 }}
                    name={lvl.label}
                  />
                ))}
              </LineChart>
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
            <ResponsiveContainer width="100%" height={Math.max(candidateStats.length * 48, 160)}>
              <BarChart
                data={candidateStats.map((cs) => {
                  const cand = candidateMap[cs.CandidateID];
                  return {
                    name: cand?.Name ?? cs.CandidateID.slice(0, 8),
                    ...cs,
                  };
                })}
                layout="vertical"
                margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
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
            <ResponsiveContainer width="100%" height={Math.max(constData.length * 48, 160)}>
              <BarChart data={constData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(_label: any, payload: any) => payload?.[0]?.payload?.fullName ?? _label}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
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
