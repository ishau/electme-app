import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { Demographics, NewVoterStats } from "@/lib/types";

export function useDemographics() {
  return useQuery({
    queryKey: ["demographics"],
    queryFn: () => get<Demographics>("/group/demographics"),
  });
}

export function useNewVoterStats() {
  return useQuery({
    queryKey: ["newVoterStats"],
    queryFn: () => get<NewVoterStats>("/group/new-voters"),
  });
}
