import { useQuery } from "@tanstack/react-query";
import { get, getGroupId } from "@/lib/api";
import type { Group } from "@/lib/types";

export function useGroup() {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: () => get<Group>(`/groups/${groupId}`),
  });
}
