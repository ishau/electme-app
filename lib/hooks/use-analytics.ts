import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type {
  SupportTrendPoint,
  ConstituencySupportBreakdown,
  OutreachDayCount,
  TeamMemberActivity,
} from "@/lib/types";

export function useSupportTrend() {
  return useQuery({
    queryKey: ["supportTrend"],
    queryFn: () => get<SupportTrendPoint[]>("/group/support-trend"),
  });
}

export function useSupportByConstituency() {
  return useQuery({
    queryKey: ["supportByConstituency"],
    queryFn: () => get<ConstituencySupportBreakdown[]>("/group/support-by-constituency"),
  });
}

export function useOutreachByDay() {
  return useQuery({
    queryKey: ["outreachByDay"],
    queryFn: () => get<OutreachDayCount[]>("/group/outreach/by-day"),
  });
}

export function useTeamActivity() {
  return useQuery({
    queryKey: ["teamActivity"],
    queryFn: () => get<TeamMemberActivity[]>("/group/team-activity"),
  });
}
