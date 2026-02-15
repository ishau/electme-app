import { get, getGroupId } from "@/lib/api";
import type { OutreachLog } from "@/lib/types";
import { FollowUpList } from "@/components/campaign/follow-up-list";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarClock } from "lucide-react";

export default async function FollowUpsPage() {
  const groupId = getGroupId();
  const followUps = await get<OutreachLog[]>(`/groups/${groupId}/outreach/follow-ups`);

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
