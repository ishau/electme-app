"use client";

import { useParams } from "next/navigation";
import { useCandidateVoters } from "@/lib/hooks/use-candidates";
import { CandidateVoterSearch } from "@/components/candidates/candidate-voter-search";
import { CandidateVoterTable } from "@/components/candidates/candidate-voter-table";
import { useQueryStates, parseAsString } from "nuqs";

export default function CandidateVotersPage() {
  const { candidateId } = useParams<{ candidateId: string }>();

  const [filters] = useQueryStates(
    {
      level: parseAsString.withDefault(""),
      name: parseAsString.withDefault(""),
    },
    { shallow: false }
  );

  const voterParams: Record<string, string> = {};
  if (filters.level) voterParams.level = filters.level;

  const { data: voters } = useCandidateVoters(candidateId, Object.keys(voterParams).length > 0 ? voterParams : undefined);

  const allVoters = voters ?? [];

  return (
    <div className="space-y-6">
      <CandidateVoterSearch />
      <CandidateVoterTable voters={allVoters} candidateId={candidateId} />
    </div>
  );
}
