import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { CandidateSupportSummary, AssessedVoter } from "@/lib/types";

export function useCandidateSummaries() {
  return useQuery({
    queryKey: ["candidateSummaries"],
    queryFn: () =>
      get<CandidateSupportSummary[]>(`/group/support-by-candidate`).catch(
        () => [] as CandidateSupportSummary[]
      ),
  });
}

export function useCandidateVoters(candidateId: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: ["candidateVoters", candidateId, params],
    queryFn: () =>
      get<AssessedVoter[]>(
        `/group/candidates/${candidateId}/voters`,
        params
      ).catch(() => [] as AssessedVoter[]),
    enabled: !!candidateId,
    placeholderData: keepPreviousData,
  });
}