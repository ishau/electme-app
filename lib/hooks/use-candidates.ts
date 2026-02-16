import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get, getGroupId } from "@/lib/api";
import type { CandidateSupportSummary, AssessedVoter } from "@/lib/types";

export function useCandidateSummaries() {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["candidateSummaries", groupId],
    queryFn: () =>
      get<CandidateSupportSummary[]>(`/groups/${groupId}/support-by-candidate`).catch(
        () => [] as CandidateSupportSummary[]
      ),
  });
}

export function useCandidateVoters(candidateId: string, params?: Record<string, string>) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["candidateVoters", groupId, candidateId, params],
    queryFn: () =>
      get<AssessedVoter[]>(
        `/groups/${groupId}/candidates/${candidateId}/voters`,
        params
      ).catch(() => [] as AssessedVoter[]),
    enabled: !!candidateId,
    placeholderData: keepPreviousData,
  });
}
