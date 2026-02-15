import { get, getGroupId } from "@/lib/api";
import type { Group } from "@/lib/types";
import { TeamView } from "@/components/team/team-view";
import { AddMemberButton } from "@/components/team/add-member-button";
import { Page } from "@/components/shared/page";

export default async function TeamPage() {
  const groupId = getGroupId();
  const group = await get<Group>(`/groups/${groupId}`);
  const members = group.TeamMembers ?? [];

  return (
    <Page title="Team Members" description={`${members.length} members`} actions={<AddMemberButton />}>
      <TeamView members={members} />
    </Page>
  );
}
