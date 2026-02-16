"use client";

import { useFollowUps } from "@/lib/hooks/use-campaign";
import { FollowUpList } from "@/components/campaign/follow-up-list";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarClock } from "lucide-react";
import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function FollowUpsPage() {
  const { data: followUps, isLoading } = useFollowUps();

  if (isLoading) {
    return <Page title="Follow-Ups" description="Loading..."><PageSkeleton /></Page>;
  }

  return (
    <Page
      title="Follow-Ups"
      description="All pending follow-up contacts"
    >
      {!followUps || followUps.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No follow-ups" description="All follow-ups have been completed." />
      ) : (
        <FollowUpList followUps={followUps} />
      )}
    </Page>
  );
}
