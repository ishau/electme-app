import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { House } from "@/lib/types";

export function useHouses(search: string) {
  return useQuery({
    queryKey: ["houses", search],
    queryFn: () => get<House[]>(`/group/houses`, search ? { search } : undefined),
    placeholderData: keepPreviousData,
  });
}
