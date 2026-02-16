"use client";

import Link from "next/link";
import { useGroup } from "@/lib/hooks/use-group";
import { useSupportSummary, useOutreachStats, useCandidateSupport } from "@/lib/hooks/use-campaign";
import { useFollowUps } from "@/lib/hooks/use-campaign";
import { Page } from "@/components/shared/page";
import { StatCard } from "@/components/shared/stat-card";
import { SupportSummaryChart } from "@/components/groups/support-summary-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  UserCog,
  Phone,
  CalendarClock,
  Vote,
  TrendingUp,
  Target,
  ArrowRight,
} from "lucide-react";
import { outreachMethodLabel, outreachOutcomeLabel, formatDate } from "@/lib/utils";
import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function DashboardPage() {
  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: supportSummary } = useSupportSummary();
  const { data: outreachStats } = useOutreachStats();
  const { data: followUps } = useFollowUps();
  const { data: candidateSupport } = useCandidateSupport();

  const totalVoters = supportSummary
    ? supportSummary.TotalAssessed + supportSummary.NotAssessed
    : 0;
  const assessedPercent =
    totalVoters > 0
      ? Math.round((supportSummary!.TotalAssessed / totalVoters) * 100)
      : 0;
  const contactedPercent =
    totalVoters > 0
      ? Math.round(((outreachStats?.UniqueContacted ?? 0) / totalVoters) * 100)
      : 0;
  const supportive =
    (supportSummary?.StrongSupporter ?? 0) + (supportSummary?.Leaning ?? 0);
  const ownCandidates =
    group?.Candidates?.filter((c) => c.IsOwnCandidate) ?? [];
  const allCandidates = group?.Candidates ?? [];
  const candidateMap = Object.fromEntries(allCandidates.map((c) => [c.ID, c]));
  const candidateStats = candidateSupport ?? [];
  const pendingFollowUps = followUps ?? [];

  if (groupLoading) {
    return <Page title="Dashboard" description="Loading..."><PageSkeleton /></Page>;
  }

  return (
    <Page title="Dashboard" description={group?.Name}>
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Voters"
          value={totalVoters.toLocaleString()}
          description={`${assessedPercent}% assessed`}
          icon={Users}
        />
        <StatCard
          title="Supportive"
          value={supportive.toLocaleString()}
          description={`${totalVoters > 0 ? Math.round((supportive / totalVoters) * 100) : 0}% of voters`}
          icon={TrendingUp}
        />
        <StatCard
          title="Contacted"
          value={outreachStats?.UniqueContacted ?? 0}
          description={`${contactedPercent}% reached`}
          icon={Phone}
        />
        <StatCard
          title="Follow-Ups"
          value={outreachStats?.PendingFollowUps ?? 0}
          description="pending"
          icon={CalendarClock}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {supportSummary && <SupportSummaryChart summary={supportSummary} />}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outreach Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {outreachStats && Object.keys(outreachStats.ByMethod || {}).length > 0 ? (
              <>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">By Method</p>
                  <div className="space-y-1.5">
                    {Object.entries(outreachStats.ByMethod || {})
                      .sort(([, a], [, b]) => b - a)
                      .map(([method, count]) => {
                        const pct = outreachStats.TotalContacts > 0
                          ? (count / outreachStats.TotalContacts) * 100
                          : 0;
                        return (
                          <div key={method}>
                            <div className="flex justify-between text-sm mb-0.5">
                              <span>{outreachMethodLabel(method)}</span>
                              <span className="text-muted-foreground">{count}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">By Outcome</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(outreachStats.ByOutcome || {})
                      .sort(([, a], [, b]) => b - a)
                      .map(([outcome, count]) => (
                        <Badge key={outcome} variant={outcome === "positive" ? "default" : "secondary"}>
                          {outreachOutcomeLabel(outcome)} ({count})
                        </Badge>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No outreach yet. Start contacting voters.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Candidate Support Breakdown */}
      {candidateStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Support by Candidate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {candidateStats.map((cs) => {
                const cand = candidateMap[cs.CandidateID];
                const total = cs.TotalAssessed || 1;
                const segments = [
                  { key: "strong", count: cs.StrongSupporter, color: "bg-green-500", label: "Strong" },
                  { key: "leaning", count: cs.Leaning, color: "bg-yellow-400", label: "Leaning" },
                  { key: "undecided", count: cs.Undecided, color: "bg-gray-300", label: "Undecided" },
                  { key: "soft_opp", count: cs.SoftOpposition, color: "bg-orange-400", label: "Soft Opp" },
                  { key: "hard_opp", count: cs.HardOpposition, color: "bg-red-500", label: "Hard Opp" },
                ];
                return (
                  <div key={cs.CandidateID}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {cand && <span className="text-sm font-bold text-primary">#{cand.Number}</span>}
                        <span className="text-sm font-medium">
                          {cand?.Name ?? cs.CandidateID.slice(0, 8)}
                        </span>
                        {cand && (
                          <Badge variant={cand.IsOwnCandidate ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                            {cand.IsOwnCandidate ? "Ours" : cand.CandidateType.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{cs.TotalAssessed} assessed</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
                      {segments.map((seg) =>
                        seg.count > 0 ? (
                          <div
                            key={seg.key}
                            className={`h-full ${seg.color}`}
                            style={{ width: `${(seg.count / total) * 100}%` }}
                            title={`${seg.label}: ${seg.count}`}
                          />
                        ) : null
                      )}
                    </div>
                    <div className="flex gap-3 mt-1">
                      {segments.map((seg) =>
                        seg.count > 0 ? (
                          <span key={seg.key} className="text-[10px] text-muted-foreground">
                            {seg.label} {seg.count}
                          </span>
                        ) : null
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Follow-Ups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Follow-Ups</CardTitle>
            {pendingFollowUps.length > 0 && (
              <Link href="/campaign/follow-ups">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {pendingFollowUps.length > 0 ? (
              <div className="space-y-2">
                {pendingFollowUps.slice(0, 5).map((log) => (
                  <div key={log.ID} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{outreachMethodLabel(log.Method)}</Badge>
                      <span className="text-muted-foreground">{log.ContactedBy}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {log.FollowUpDate ? formatDate(log.FollowUpDate) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending follow-ups.</p>
            )}
          </CardContent>
        </Card>

        {/* Team & Candidates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team & Candidates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ownCandidates.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Candidates</p>
                <div className="space-y-1.5">
                  {ownCandidates.map((candidate) => (
                    <div key={candidate.ID} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-primary">#{candidate.Number}</span>
                        <div>
                          <p className="text-sm font-medium">{candidate.Name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {candidate.CandidateType.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Team ({group?.TeamMembers?.length ?? 0})
                </p>
                <Link href="/team">
                  <Button variant="ghost" size="sm">
                    Manage <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
              {(group?.TeamMembers?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {group!.TeamMembers!.slice(0, 8).map((m) => (
                    <Badge key={m.ID} variant="secondary">
                      {m.Name}
                    </Badge>
                  ))}
                  {group!.TeamMembers!.length > 8 && (
                    <Badge variant="outline">+{group!.TeamMembers!.length - 8} more</Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No team members yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/constituents">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">Voters</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/campaign">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">Campaign</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/voting">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Vote className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">Voting</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/team">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <UserCog className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">Team</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </Page>
  );
}
