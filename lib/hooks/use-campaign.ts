import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { SupportSummary, OutreachStats, OutreachLog, CandidateSupportSummary } from "@/lib/types";

export function useSupportSummary() {
  return useQuery({
    queryKey: ["supportSummary"],
    queryFn: () => get<SupportSummary>(`/group/support-summary`),
  });
}

export function useOutreachStats() {
  return useQuery({
    queryKey: ["outreachStats"],
    queryFn: () => get<OutreachStats>(`/group/outreach/stats`),
  });
}

export function useFollowUps() {
  return useQuery({
    queryKey: ["followUps"],
    queryFn: () => get<OutreachLog[]>(`/group/outreach/follow-ups`),
  });
}

export function useCandidateSupport() {
  return useQuery({
    queryKey: ["candidateSupport"],
    queryFn: () => get<CandidateSupportSummary[]>(`/group/support-by-candidate`),
  });
}