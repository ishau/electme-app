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
import { AffiliationCard } from "@/components/constituents/affiliation-card";
import { TransportCard } from "@/components/constituents/transport-card";
import { HouseholdCard } from "@/components/constituents/household-card";
import { Page } from "@/components/shared/page";
import { GenderBadge } from "@/components/shared/gender-badge";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const affiliationBadge = affiliationParty ? (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white cursor-default" style={{ backgroundColor: affiliationParty.Color }} />}>
        <span
          className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold"
        >
          {affiliationParty.Code?.[0]}
        </span>
        {affiliationParty.Code}
      </TooltipTrigger>
      <TooltipContent>
        <p>{affiliationParty.Name}</p>
        {latestAffiliation.KnownDate && (
          <p className="text-xs text-muted-foreground">
            Last known {new Date(latestAffiliation.KnownDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  ) : (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
      Independent
    </span>
  );

  return (
    <Page
      title={constituent.FullName}
      description={
        <span className="flex items-center gap-2 flex-wrap">
          <span>{constituent.FullNationalID ?? constituent.MaskedNationalID}</span>
          <GenderBadge sex={constituent.Sex} />
          {constituent.Age != null && <span>{constituent.Age} yrs</span>}
          {affiliationBadge}
        </span>
      }
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
              address: address?.Name,
              islandName: address?.IslandName,
              nicknames: constituent.Nicknames,
            }}
          />

          <SupportForm constituentId={constituentId} constituencyId={constituent?.ConstituencyID ?? ""} history={supportHistory ?? []} candidates={group?.Candidates ?? []} parties={parties ?? []} />
          <OutreachForm constituentId={constituentId} history={outreachHistory ?? []} />

          <TransportCard constituentId={constituentId} constituencyId={constituent?.ConstituencyID ?? ""} />

          <RelationshipList
            constituentId={constituentId}
            relationships={relationships ?? []}
            parties={parties ?? []}
          />

          <AffiliationCard
            constituentId={constituentId}
            affiliations={sortedAffiliations}
            parties={parties ?? []}
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
