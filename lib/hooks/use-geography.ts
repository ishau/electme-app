import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { Atoll, Island } from "@/lib/types";

export function useAtolls() {
  return useQuery({
    queryKey: ["atolls"],
    queryFn: () => get<Atoll[]>("/group/atolls"),
    staleTime: Infinity,
  });
}

export function useIslands(atollId: string) {
  return useQuery({
    queryKey: ["islands", atollId],
    queryFn: () => get<Island[]>(`/group/atolls/${atollId}/islands`),
    enabled: !!atollId,
    staleTime: Infinity,
  });
}
