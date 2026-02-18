import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { Constituency } from "@/lib/types";

export function useConstituencies() {
  return useQuery({
    queryKey: ["constituencies"],
    queryFn: () => get<Constituency[]>("/group/constituencies"),
    staleTime: Infinity,
  });
}

export function useConstituency(id: string) {
  return useQuery({
    queryKey: ["constituency", id],
    queryFn: () => get<Constituency>(`/group/constituencies/${id}`),
    enabled: !!id,
    staleTime: Infinity,
  });
}
