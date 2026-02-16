import { get, getGroupId } from "@/lib/api";
import type { Constituent, EnrichedConstituent, SupportAssessment, OutreachLog, Relationship, Party, Group } from "@/lib/types";
import { fetchVotersByAddress, fetchLatestSupport } from "@/lib/actions/campaign";
import { ProfileForm } from "@/components/constituents/profile-form";
import { SupportForm } from "@/components/constituents/support-form";
import { OutreachForm } from "@/components/constituents/outreach-form";
import { RelationshipList } from "@/components/constituents/relationship-list";
import { HouseholdCard } from "@/components/constituents/household-card";
import { Page } from "@/components/shared/page";

export default async function ConstituentDetailPage({
  params,
}: {
  params: Promise<{ constituentId: string }>;
}) {
  const { constituentId } = await params;
  const groupId = getGroupId();

  const [constituent, baseConstituent, supportHistory, outreachHistory, relationships, parties, group] = await Promise.all([
    get<EnrichedConstituent>(`/groups/${groupId}/constituents/${constituentId}`),
    get<Constituent>(`/constituents/${constituentId}`),
    get<SupportAssessment[]>(`/groups/${groupId}/constituents/${constituentId}/support`),
    get<OutreachLog[]>(`/groups/${groupId}/constituents/${constituentId}/outreach`),
    get<Relationship[]>(`/groups/${groupId}/constituents/${constituentId}/relationships`),
    get<Party[]>("/parties"),
    get<Group>(`/groups/${groupId}`),
  ]);

  const activeAffiliation = constituent.Affiliations?.find((a) => !a.Period.EndDate);
  const affiliationParty = activeAffiliation ? parties?.find((p) => p.ID === activeAffiliation.PartyID) : null;

  // Fetch neighbors (same address) and their support levels
  const address = baseConstituent?.PermanentAddress;
  let neighbors: Constituent[] = [];
  let neighborSupport: Record<string, SupportAssessment> = {};

  if (address?.Name && address?.IslandID) {
    neighbors = await fetchVotersByAddress(address.Name, address.IslandID);
    const neighborIds = neighbors
      .filter((n) => n.ID !== constituentId)
      .map((n) => n.ID);
    if (neighborIds.length > 0) {
      neighborSupport = await fetchLatestSupport(neighborIds);
    }
  }

  // Fetch support levels for related persons
  const rels = relationships ?? [];
  const relatedIds = rels.map((r) =>
    r.FromID === constituentId ? r.ToID : r.FromID
  );
  let relatedSupport: Record<string, SupportAssessment> = {};
  const relatedNames: Record<string, string> = {};
  if (relatedIds.length > 0) {
    relatedSupport = await fetchLatestSupport(relatedIds);
    // Fetch names for related constituents
    await Promise.all(
      relatedIds.map(async (rid) => {
        try {
          const c = await get<Constituent>(`/constituents/${rid}`);
          if (c) relatedNames[rid] = c.FullName;
        } catch { /* skip */ }
      })
    );
  }

  const age = constituent.DOB ? (() => {
    const [year, month, day] = constituent.DOB!.split("T")[0].split("-").map(Number);
    const now = new Date(Date.now() + 5 * 60 * 60 * 1000);
    let a = now.getUTCFullYear() - year;
    if (now.getUTCMonth() + 1 < month || (now.getUTCMonth() + 1 === month && now.getUTCDate() < day)) a--;
    return a;
  })() : null;

  return (
    <Page
      title={constituent.FullName}
      description={`${constituent.FullNationalID ?? constituent.MaskedNationalID} | ${constituent.Sex === "M" ? "Male" : "Female"}${age !== null ? ` | ${age} yrs` : ""}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProfileForm
            constituentId={constituentId}
            profile={constituent.Profile}
            basicInfo={{
              nationalId: constituent.FullNationalID ?? constituent.MaskedNationalID,
              sex: constituent.Sex,
              dob: constituent.DOB ?? undefined,
              affiliationCode: affiliationParty?.Code ?? null,
              address: address?.Name,
              nicknames: constituent.Nicknames,
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SupportForm constituentId={constituentId} constituencyId={baseConstituent?.ConstituencyID ?? ""} history={supportHistory ?? []} candidates={group?.Candidates ?? []} />
            <OutreachForm constituentId={constituentId} history={outreachHistory ?? []} />
          </div>
        </div>

        <div className="space-y-6">
          <HouseholdCard
            currentConstituentId={constituentId}
            neighbors={neighbors}
            latestSupport={neighborSupport}
            address={address?.Name}
            islandId={address?.IslandID}
            islandName={address?.IslandID}
            constituencyId={baseConstituent?.ConstituencyID}
            candidates={group?.Candidates ?? []}
          />

          <RelationshipList
            constituentId={constituentId}
            relationships={rels}
            latestSupport={relatedSupport}
            relatedNames={relatedNames}
          />
        </div>
      </div>
    </Page>
  );
}
