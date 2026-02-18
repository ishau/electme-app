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
import { ProfileForm } from "@/components/constituents/profile-form";
import { SupportForm } from "@/components/constituents/support-form";
import { OutreachForm } from "@/components/constituents/outreach-form";
import { RelationshipList } from "@/components/constituents/relationship-list";
import { TransportCard } from "@/components/constituents/transport-card";
import { VotingCard } from "@/components/constituents/voting-card";
import { HouseholdCard } from "@/components/constituents/household-card";
import { Page } from "@/components/shared/page";
import { PageSkeleton } from "@/components/shared/loading-skeleton";

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

  if (!constituent) return <Page title="Loading..." description=""><PageSkeleton /></Page>;

  const sortedAffiliations = [...(constituent.Affiliations ?? [])].sort(
    (a, b) => new Date(b.KnownDate ?? 0).getTime() - new Date(a.KnownDate ?? 0).getTime()
  );
  const latestAffiliation = sortedAffiliations[0];
  const affiliationParty = latestAffiliation ? parties?.find((p) => p.ID === latestAffiliation.PartyID) : null;

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
            affiliations={sortedAffiliations}
            parties={parties ?? []}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SupportForm constituentId={constituentId} constituencyId={constituent?.ConstituencyID ?? ""} history={supportHistory ?? []} candidates={group?.Candidates ?? []} parties={parties ?? []} />
            <OutreachForm constituentId={constituentId} history={outreachHistory ?? []} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TransportCard constituentId={constituentId} constituencyId={constituent?.ConstituencyID ?? ""} />
            <VotingCard constituentId={constituentId} constituencyId={constituent?.ConstituencyID ?? ""} fullName={constituent.FullName} />
          </div>

          <RelationshipList
            constituentId={constituentId}
            relationships={relationships ?? []}
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
            parties={parties ?? []}
          />
        </div>
      </div>
    </Page>
  );
}
