import { useQuery } from "@tanstack/react-query";
import { get, getGroupId } from "@/lib/api";
import type { SupportSummary, OutreachStats, OutreachLog, CandidateSupportSummary } from "@/lib/types";

export function useSupportSummary() {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["supportSummary", groupId],
    queryFn: () => get<SupportSummary>(`/groups/${groupId}/support-summary`),
  });
}

export function useOutreachStats() {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["outreachStats", groupId],
    queryFn: () => get<OutreachStats>(`/groups/${groupId}/outreach/stats`),
  });
}

export function useFollowUps() {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["followUps", groupId],
    queryFn: () => get<OutreachLog[]>(`/groups/${groupId}/outreach/follow-ups`),
  });
}

export function useCandidateSupport() {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["candidateSupport", groupId],
    queryFn: () => get<CandidateSupportSummary[]>(`/groups/${groupId}/support-by-candidate`),
  });
}
