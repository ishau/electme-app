import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { Group } from "@/lib/types";

export function useGroup() {
  return useQuery({
    queryKey: ["group"],
    queryFn: () => get<Group>(`/group`),
  });
}