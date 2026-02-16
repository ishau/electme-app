"use client";

import { useGroup } from "@/lib/hooks/use-group";
import { useParties } from "@/lib/hooks/use-parties";
import { AppShell } from "@/components/layout/app-shell";

export function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: group } = useGroup();
  const { data: parties } = useParties();

  const party = parties?.find((p) => p.ID === group?.PartyID);

  return (
    <AppShell groupName={group?.Name ?? ""} partyCode={party?.Code}>
      {children}
    </AppShell>
  );
}
