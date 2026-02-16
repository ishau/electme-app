"use client";

import { useParams } from "next/navigation";
import {
  useEnrichedConstituent,
  useSupportHistory,
  useOutreachHistory,
  useRelationships,
  useNeighbors,
  useLatestSupport,
} from "@/lib/hooks/use-constituents";
import { useParties } from "@/lib/hooks/use-parties";
import { useGroup } from "@/lib/hooks/use-group";
import { get } from "@/lib/api";
import { ProfileForm } from "@/components/constituents/profile-form";
import { SupportForm } from "@/components/constituents/support-form";
import { OutreachForm } from "@/components/constituents/outreach-form";
import { RelationshipList } from "@/components/constituents/relationship-list";
import { HouseholdCard } from "@/components/constituents/household-card";
import { Page } from "@/components/shared/page";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import type { Constituent } from "@/lib/types";

export default function ConstituentDetailPage() {
  const { constituentId } = useParams<{ constituentId: string }>();

  const { data: constituent } = useEnrichedConstituent(constituentId);
  const { data: supportHistory } = useSupportHistory(constituentId);
  const { data: outreachHistory } = useOutreachHistory(constituentId);
  const { data: relationships } = useRelationships(constituentId);
  const { data: parties } = useParties();
  const { data: group } = useGroup();

  const address = constituent?.PermanentAddress;
  const { data: neighbors } = useNeighbors(address?.Name, address?.IslandID);

  const neighborIds = (neighbors ?? [])
    .filter((n) => n.ID !== constituentId)
    .map((n) => n.ID);
  const { data: neighborSupport } = useLatestSupport(neighborIds);

  const rels = relationships ?? [];
  const relatedIds = rels.map((r) =>
    r.FromID === constituentId ? r.ToID : r.FromID
  );
  const { data: relatedSupport } = useLatestSupport(relatedIds);

  // Fetch names for related constituents
  const { data: relatedNames } = useQuery({
    queryKey: ["relatedNames", relatedIds],
    queryFn: async () => {
      const names: Record<string, string> = {};
      await Promise.all(
        relatedIds.map(async (rid) => {
          try {
            const c = await get<Constituent>(`/constituents/${rid}`);
            if (c) names[rid] = c.FullName;
          } catch { /* skip */ }
        })
      );
      return names;
    },
    enabled: relatedIds.length > 0,
  });

  if (!constituent) return <Page title="Loading..." description=""><PageSkeleton /></Page>;

  const activeAffiliation = constituent.Affiliations?.find((a) => !a.Period.EndDate);
  const affiliationParty = activeAffiliation ? parties?.find((p) => p.ID === activeAffiliation.PartyID) : null;

  return (
    <Page
      title={constituent.FullName}
      description={`${constituent.FullNationalID ?? constituent.MaskedNationalID} | ${constituent.Sex === "M" ? "Male" : "Female"}${constituent.Age != null ? ` | ${constituent.Age} yrs` : ""}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProfileForm
            constituentId={constituentId}
            profile={constituent.Profile}
            basicInfo={{
              nationalId: constituent.FullNationalID ?? constituent.MaskedNationalID,
              sex: constituent.Sex,
              age: constituent.Age ?? undefined,
              affiliationCode: affiliationParty?.Code ?? null,
              address: address?.Name,
              islandName: address?.IslandName,
              nicknames: constituent.Nicknames,
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SupportForm constituentId={constituentId} constituencyId={constituent?.ConstituencyID ?? ""} history={supportHistory ?? []} candidates={group?.Candidates ?? []} />
            <OutreachForm constituentId={constituentId} history={outreachHistory ?? []} />
          </div>

          <RelationshipList
            constituentId={constituentId}
            relationships={rels}
            latestSupport={relatedSupport ?? {}}
            relatedNames={relatedNames ?? {}}
          />
        </div>

        <div className="space-y-6">
          <HouseholdCard
            currentConstituentId={constituentId}
            neighbors={neighbors ?? []}
            latestSupport={neighborSupport ?? {}}
            address={address?.Name}
            islandId={address?.IslandID}
            islandName={address?.IslandName}
            constituencyId={constituent?.ConstituencyID}
            candidates={group?.Candidates ?? []}
          />
        </div>
      </div>
    </Page>
  );
}
