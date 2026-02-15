import { get, getGroupId } from "@/lib/api";
import type { VoterRegistration, Constituency, Group } from "@/lib/types";
import { RegistrationsView } from "@/components/voting/registrations-view";
import { Page } from "@/components/shared/page";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ClipboardList, Bus, CheckCircle, MapPin } from "lucide-react";

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ constituency_id?: string; transport_only?: string }>;
}) {
  const params = await searchParams;
  const groupId = getGroupId();

  const [group, constituencies] = await Promise.all([
    get<Group>(`/groups/${groupId}`),
    get<Constituency[]>("/constituencies"),
  ]);

  const constituencyId =
    params.constituency_id || (group?.Constituencies?.[0] ?? "");

  if (!constituencyId) {
    return (
      <Page title="Voter Registrations" description="Registration and transport management">
        <EmptyState
          icon={MapPin}
          title="No constituencies"
          description="This group has no constituencies assigned yet."
        />
      </Page>
    );
  }

  const [registrations, transportNeeded] = await Promise.all([
    get<VoterRegistration[]>(
      `/groups/${groupId}/registrations`,
      { constituency_id: constituencyId }
    ),
    get<VoterRegistration[]>(`/groups/${groupId}/registrations/transport-needed`),
  ]);

  const showTransportOnly = params.transport_only === "true";
  const displayed = showTransportOnly ? transportNeeded : registrations;

  return (
    <Page title="Voter Registrations" description="Registration and transport management">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Total Registrations" value={registrations?.length ?? 0} icon={ClipboardList} />
        <StatCard title="Transport Needed" value={transportNeeded?.length ?? 0} icon={Bus} />
        <StatCard title="Re-registered" value={registrations?.filter((r) => r.IsReregistered).length ?? 0} icon={CheckCircle} />
      </div>

      <RegistrationsView
        registrations={displayed ?? []}
        constituencies={constituencies ?? []}
        currentConstituencyId={constituencyId}
        showTransportOnly={showTransportOnly}
      />
    </Page>
  );
}
