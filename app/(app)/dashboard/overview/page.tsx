"use client";

import Link from "next/link";
import { useSupportSummary, useOutreachStats, useFollowUps } from "@/lib/hooks/use-campaign";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Phone,
  CalendarClock,
  Vote,
  TrendingUp,
  Target,
  ArrowRight,
  UserCog,
} from "lucide-react";
import { outreachMethodLabel, formatDate } from "@/lib/utils";
import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function OverviewPage() {
  const { data: supportSummary, isLoading: summaryLoading } = useSupportSummary();
  const { data: outreachStats } = useOutreachStats();
  const { data: followUps } = useFollowUps();

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
  const pendingFollowUps = followUps ?? [];

  if (summaryLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
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
                    {log.FollowUpDate ? formatDate(log.FollowUpDate) : "\u2014"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pending follow-ups.</p>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
