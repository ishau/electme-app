import { get, getGroupId } from "@/lib/api";
import type { TurnoutStats, Constituency, Group, Constituent } from "@/lib/types";
import { VotingView } from "@/components/voting/voting-view";
import { Page } from "@/components/shared/page";

export default async function VotingDayPage({
  searchParams,
}: {
  searchParams: Promise<{ constituency_id?: string }>;
}) {
  const params = await searchParams;
  const groupId = getGroupId();

  const [group, constituencies] = await Promise.all([
    get<Group>(`/groups/${groupId}`),
    get<Constituency[]>("/constituencies"),
  ]);

  const selectedConstituencyId = params.constituency_id || group?.Constituencies?.[0] || "";

  let turnout: TurnoutStats | null = null;
  let nonVoters: string[] | null = null;
  let voters: Constituent[] = [];

  if (selectedConstituencyId) {
    [turnout, nonVoters, voters] = await Promise.all([
      get<TurnoutStats>(`/groups/${groupId}/turnout`, { constituency_id: selectedConstituencyId }),
      get<string[]>(`/groups/${groupId}/non-voters`, { constituency_id: selectedConstituencyId }),
      get<Constituent[]>(`/groups/${groupId}/constituents`, { constituency_id: selectedConstituencyId }).catch(() => []),
    ]);
  }

  return (
    <Page title="Voting Day" description="Live turnout tracking and vote recording">
      <VotingView
        group={group}
        constituencies={constituencies ?? []}
        turnout={turnout}
        nonVoters={nonVoters ?? []}
        voters={voters ?? []}
        currentConstituencyId={selectedConstituencyId}
      />
    </Page>
  );
}
