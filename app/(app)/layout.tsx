import { get, getGroupId } from "@/lib/api";
import type { Group, Party } from "@/lib/types";
import { AppShell } from "@/components/layout/app-shell";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const groupId = getGroupId();
  const [group, parties] = await Promise.all([
    get<Group>(`/groups/${groupId}`),
    get<Party[]>("/parties"),
  ]);
  const party = parties?.find((p) => p.ID === group?.PartyID);

  return (
    <NuqsAdapter>
      <AppShell groupName={group.Name} partyCode={party?.Code}>
        {children}
      </AppShell>
    </NuqsAdapter>
  );
}
