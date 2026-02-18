"use client";

import { useGroup } from "@/lib/hooks/use-group";
import { useConstituencies } from "@/lib/hooks/use-constituencies";
import { useTurnout, useNonVoters, useVotersForConstituency } from "@/lib/hooks/use-voting";
import { VotingView } from "@/components/voting/voting-view";
import { Page } from "@/components/shared/page";
import { VotingPageSkeleton } from "@/components/shared/loading-skeleton";
import { useQueryState, parseAsString } from "nuqs";

export default function VotingDayPage() {
  const [constituencyId] = useQueryState("constituency_id", parseAsString.withDefault(""));

  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: constituencies } = useConstituencies();

  const selectedConstituencyId = constituencyId || group?.Constituencies?.[0] || "";

  const { data: turnout } = useTurnout(selectedConstituencyId);
  const { data: nonVoters } = useNonVoters(selectedConstituencyId);
  const { data: voters } = useVotersForConstituency(selectedConstituencyId);

  if (groupLoading) {
    return <Page title="Voting Day" description="Loading..."><VotingPageSkeleton /></Page>;
  }

  return (
    <Page title="Voting Day" description="Live turnout tracking and vote recording">
      <VotingView
        group={group ?? null}
        constituencies={constituencies ?? []}
        turnout={turnout ?? null}
        nonVoters={nonVoters ?? []}
        voters={voters ?? []}
        currentConstituencyId={selectedConstituencyId}
      />
    </Page>
  );
}
