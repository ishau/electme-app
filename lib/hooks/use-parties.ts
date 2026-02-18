import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { Party } from "@/lib/types";

export function useParties() {
  return useQuery({
    queryKey: ["parties"],
    queryFn: () => get<Party[]>("/group/parties"),
    staleTime: Infinity,
  });
}
