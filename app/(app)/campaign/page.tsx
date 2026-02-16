"use client";

import Link from "next/link";
import { useOutreachStats, useFollowUps } from "@/lib/hooks/use-campaign";
import { OutreachStatsDisplay } from "@/components/campaign/outreach-stats";
import { FollowUpList } from "@/components/campaign/follow-up-list";
import { Page } from "@/components/shared/page";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Users, CalendarClock, ArrowRight } from "lucide-react";
import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function CampaignPage() {
  const { data: stats, isLoading } = useOutreachStats();
  const { data: followUps } = useFollowUps();

  if (isLoading) {
    return <Page title="Campaign" description="Loading..."><PageSkeleton /></Page>;
  }

  return (
    <Page title="Campaign" description="Outreach statistics and follow-ups">
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Contacts" value={stats.TotalContacts} icon={Phone} />
            <StatCard title="Unique Contacted" value={stats.UniqueContacted} icon={Users} />
            <StatCard title="Pending Follow-Ups" value={stats.PendingFollowUps} icon={CalendarClock} />
            <StatCard
              title="Contact Rate"
              value={stats.TotalContacts > 0 ? `${((stats.UniqueContacted / stats.TotalContacts) * 100).toFixed(0)}%` : "0%"}
            />
          </div>
          <OutreachStatsDisplay stats={stats} />
        </>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Pending Follow-Ups</CardTitle>
          <Link href="/campaign/follow-ups">
            <Button variant="outline" size="sm">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {followUps && followUps.length > 0 ? (
            <FollowUpList followUps={followUps.slice(0, 5)} />
          ) : (
            <p className="text-sm text-muted-foreground">No pending follow-ups.</p>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}
