"use client";

import { useGroup } from "@/lib/hooks/use-group";
import { TeamView } from "@/components/team/team-view";
import { AddMemberButton } from "@/components/team/add-member-button";
import { Page } from "@/components/shared/page";
import { ListPageSkeleton } from "@/components/shared/loading-skeleton";

export default function TeamPage() {
  const { data: group, isLoading: groupLoading } = useGroup();
  const members = group?.TeamMembers ?? [];

  if (groupLoading) {
    return <Page title="Team Members" description="Loading..."><ListPageSkeleton rows={5} /></Page>;
  }

  return (
    <Page title="Team Members" description={`${members.length} members`} actions={<AddMemberButton />}>
      <TeamView members={members} />
    </Page>
  );
}
