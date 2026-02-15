import { get, getGroupId } from "@/lib/api";
import type { TurnoutStats, Constituency, Group } from "@/lib/types";
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

  if (selectedConstituencyId) {
    [turnout, nonVoters] = await Promise.all([
      get<TurnoutStats>(`/groups/${groupId}/voting/turnout`, { constituency_id: selectedConstituencyId }),
      get<string[]>(`/groups/${groupId}/voting/non-voters`, { constituency_id: selectedConstituencyId }),
    ]);
  }

  return (
    <Page title="Voting Day" description="Live turnout tracking and vote recording">
      <VotingView
        group={group}
        constituencies={constituencies ?? []}
        turnout={turnout}
        nonVoters={nonVoters ?? []}
        currentConstituencyId={selectedConstituencyId}
      />
    </Page>
  );
}
