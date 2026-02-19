"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useGroup } from "@/lib/hooks/use-group";
import { useCandidateSummaries, useCandidateVoters } from "@/lib/hooks/use-candidates";
import { useParties } from "@/lib/hooks/use-parties";
import { Page } from "@/components/shared/page";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CandidateVoterSearch } from "@/components/candidates/candidate-voter-search";
import { CandidateVoterTable } from "@/components/candidates/candidate-voter-table";
import { DetailWithStatsSkeleton } from "@/components/shared/loading-skeleton";
import { CandidateNicknameDialog } from "@/components/candidates/candidate-nickname-dialog";
import { candidateDisplayName, SUPPORT_LEVEL_HEX } from "@/lib/utils";
import { useQueryStates, parseAsString } from "nuqs";
import { Users, TrendingUp, Target, UserCheck } from "lucide-react";

const normalizeType = (t: string) => t.toLowerCase().replace(/\s+/g, "_");
const TYPE_LABEL: Record<string, string> = {
  mayor: "Mayor",
  president: "President",
  wdc_president: "WDC President",
  member: "Council Member",
  "member_(reserved_for_female)": "Council Member (Women's Seat)",
  "reserved_seat_for_female": "Council Member (Women's Seat)",
  wdc_member: "WDC Member",
};

const TOOLTIP_STYLE = { fontSize: 13, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "8px 12px" };

const SUPPORT_LEVELS = [
  { key: "strong_supporter", label: "Strong", color: SUPPORT_LEVEL_HEX.strong_supporter },
  { key: "leaning", label: "Leaning", color: SUPPORT_LEVEL_HEX.leaning },
  { key: "undecided", label: "Undecided", color: SUPPORT_LEVEL_HEX.undecided },
  { key: "soft_opposition", label: "Soft Opp", color: SUPPORT_LEVEL_HEX.soft_opposition },
  { key: "hard_opposition", label: "Hard Opp", color: SUPPORT_LEVEL_HEX.hard_opposition },
];

const LEVEL_LABEL: Record<string, string> = {
  strong_supporter: "Strong",
  leaning: "Leaning",
  undecided: "Undecided",
  soft_opposition: "Soft Opp",
  hard_opposition: "Hard Opp",
};

export default function CandidateDetailPage() {
  const { candidateId } = useParams<{ candidateId: string }>();

  const [filters] = useQueryStates(
    {
      level: parseAsString.withDefault(""),
      name: parseAsString.withDefault(""),
    },
    { shallow: false }
  );

  const { data: group } = useGroup();
  const { data: summaries } = useCandidateSummaries();
  const { data: parties } = useParties();

  const voterParams: Record<string, string> = {};
  if (filters.level) voterParams.level = filters.level;

  const { data: voters } = useCandidateVoters(candidateId, Object.keys(voterParams).length > 0 ? voterParams : undefined);

  const candidate = group?.Candidates?.find((c) => c.ID === candidateId);
  const summary = (summaries ?? []).find((s) => s.CandidateID === candidateId);
  const total = summary?.TotalAssessed ?? 0;
  const party = candidate?.PartyID ? (parties ?? []).find((p) => p.ID === candidate.PartyID) : null;
  const typeLabel = candidate ? (TYPE_LABEL[normalizeType(candidate.CandidateType)] ?? candidate.CandidateType.replace(/_/g, " ")) : "";

  const allVoters = voters ?? [];

  // Support level donut data
  const supportDonut = useMemo(() => {
    if (!summary || total === 0) return [];
    return [
      { name: "Strong", value: summary.StrongSupporter, color: SUPPORT_LEVEL_HEX.strong_supporter },
      { name: "Leaning", value: summary.Leaning, color: SUPPORT_LEVEL_HEX.leaning },
      { name: "Undecided", value: summary.Undecided, color: SUPPORT_LEVEL_HEX.undecided },
      { name: "Soft Opp", value: summary.SoftOpposition, color: SUPPORT_LEVEL_HEX.soft_opposition },
      { name: "Hard Opp", value: summary.HardOpposition, color: SUPPORT_LEVEL_HEX.hard_opposition },
    ].filter((d) => d.value > 0);
  }, [summary, total]);

  // Gender breakdown
  const genderStats = useMemo(() => {
    if (allVoters.length === 0) return null;
    const male = allVoters.filter((v) => v.Sex === "M");
    const female = allVoters.filter((v) => v.Sex === "F");
    return [
      { name: "Male", value: male.length, color: "#3b82f6" },
      { name: "Female", value: female.length, color: "#ec4899" },
    ];
  }, [allVoters]);

  // Support by gender (grouped bar)
  const supportByGender = useMemo(() => {
    if (allVoters.length === 0) return [];
    const normalize = (l: string) => l.toLowerCase().replace(/\s+/g, "_");
    const genders = ["M", "F"];
    const counts: Record<string, Record<string, number>> = { M: {}, F: {} };
    for (const v of allVoters) {
      const g = genders.includes(v.Sex) ? v.Sex : "M";
      const level = normalize(v.Level);
      counts[g][level] = (counts[g][level] ?? 0) + 1;
    }
    return [
      { name: "Male", ...counts["M"] },
      { name: "Female", ...counts["F"] },
    ];
  }, [allVoters]);

  // Assessment timeline (group by date)
  const timeline = useMemo(() => {
    if (allVoters.length === 0) return [];
    const byDate: Record<string, number> = {};
    for (const v of allVoters) {
      const date = v.AssessedAt?.slice(0, 10);
      if (date) byDate[date] = (byDate[date] ?? 0) + 1;
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: date.slice(5), // MM-DD
        count,
      }));
  }, [allVoters]);

  // Assessor breakdown
  const assessorStats = useMemo(() => {
    if (allVoters.length === 0) return [];
    const counts: Record<string, number> = {};
    for (const v of allVoters) {
      const by = v.AssessedBy || "Unknown";
      counts[by] = (counts[by] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));
  }, [allVoters]);

  // Supportive percentage
  const supportive = (summary?.StrongSupporter ?? 0) + (summary?.Leaning ?? 0);
  const supportivePct = total > 0 ? ((supportive / total) * 100).toFixed(1) : "0";

  if (!candidate) return <Page title="Loading..." description=""><DetailWithStatsSkeleton /></Page>;

  return (
    <Page
      title={candidateDisplayName(candidate)}
      description={
        <span className="flex items-center gap-2">
          {party && (
            <span
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold text-white leading-none"
              style={{ backgroundColor: party.Color }}
            >
              {party.Code}
            </span>
          )}
          <span>{party?.Name ?? "Independent"} · {typeLabel}</span>
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          {candidate.IsOwnCandidate && (
            <CandidateNicknameDialog candidateId={candidateId} currentNickname={candidate.Nickname} />
          )}
          {!candidate.IsOwnCandidate && <Badge variant="secondary">Competing</Badge>}
        </div>
      }
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Assessed" value={total.toLocaleString()} icon={Users} />
        <StatCard title="Supportive" value={supportive.toLocaleString()} description={`${supportivePct}% of assessed`} icon={TrendingUp} />
        <StatCard title="Undecided" value={summary?.Undecided ?? 0} icon={Target} />
        <StatCard title="Assessors" value={assessorStats.length} icon={UserCheck} />
      </div>

      {/* Stacked bar */}
      {total > 0 && (
        <div className="flex h-3 rounded-full overflow-hidden">
          {summary!.StrongSupporter > 0 && (
            <div className="bg-support-strong" style={{ width: `${(summary!.StrongSupporter / total) * 100}%` }} title={`Strong: ${summary!.StrongSupporter}`} />
          )}
          {summary!.Leaning > 0 && (
            <div className="bg-support-leaning" style={{ width: `${(summary!.Leaning / total) * 100}%` }} title={`Leaning: ${summary!.Leaning}`} />
          )}
          {summary!.Undecided > 0 && (
            <div className="bg-support-undecided" style={{ width: `${(summary!.Undecided / total) * 100}%` }} title={`Undecided: ${summary!.Undecided}`} />
          )}
          {summary!.SoftOpposition > 0 && (
            <div className="bg-support-soft-opposition" style={{ width: `${(summary!.SoftOpposition / total) * 100}%` }} title={`Soft Opp: ${summary!.SoftOpposition}`} />
          )}
          {summary!.HardOpposition > 0 && (
            <div className="bg-support-hard-opposition" style={{ width: `${(summary!.HardOpposition / total) * 100}%` }} title={`Hard Opp: ${summary!.HardOpposition}`} />
          )}
        </div>
      )}

      {/* Charts row: Support Donut + Gender + Support by Gender */}
      {allVoters.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Support Level Donut */}
          {supportDonut.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Support Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={supportDonut}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={3}
                      strokeWidth={2}
                      stroke="#fff"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {supportDonut.map((entry, i) => (
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
          )}

          {/* Gender Donut */}
          {genderStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gender Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={genderStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={3}
                      strokeWidth={2}
                      stroke="#fff"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {genderStats.map((entry, i) => (
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
          )}

          {/* Support by Gender */}
          {supportByGender.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Support by Gender</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={supportByGender} margin={{ left: 0, right: 4, top: 4, bottom: 4 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={TOOLTIP_STYLE} />
                    <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    {SUPPORT_LEVELS.map((lvl) => (
                      <Bar key={lvl.key} dataKey={lvl.key} stackId="a" fill={lvl.color} name={lvl.label} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Assessment Timeline + Assessor Breakdown */}
      {allVoters.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assessment Timeline */}
          {timeline.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assessment Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={timeline} margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [Number(value).toLocaleString(), "Assessments"]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Assessor Breakdown */}
          {assessorStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assessments by Team Member</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(assessorStats.length * 42, 140)}>
                  <BarChart data={assessorStats} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [Number(value).toLocaleString(), "Assessments"]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Detailed support cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard title="Strong" value={summary?.StrongSupporter ?? 0} />
        <StatCard title="Leaning" value={summary?.Leaning ?? 0} />
        <StatCard title="Undecided" value={summary?.Undecided ?? 0} />
        <StatCard title="Soft Opp" value={summary?.SoftOpposition ?? 0} />
        <StatCard title="Hard Opp" value={summary?.HardOpposition ?? 0} />
      </div>

      {/* Filter bar */}
      <CandidateVoterSearch />

      {/* Voter table */}
      <CandidateVoterTable voters={allVoters} candidateId={candidateId} />
    </Page>
  );
}
