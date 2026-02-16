"use client";

import { useGroup } from "@/lib/hooks/use-group";
import { useConstituencies } from "@/lib/hooks/use-constituencies";
import { useRegistrations, useTransportNeeded } from "@/lib/hooks/use-voting";
import { RegistrationsView } from "@/components/voting/registrations-view";
import { Page } from "@/components/shared/page";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { ClipboardList, Bus, CheckCircle, MapPin } from "lucide-react";
import { useQueryState, parseAsString } from "nuqs";

export default function RegistrationsPage() {
  const [constituencyParam] = useQueryState("constituency_id", parseAsString.withDefault(""));
  const [transportOnly] = useQueryState("transport_only", parseAsString.withDefault(""));

  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: constituencies } = useConstituencies();

  const constituencyId = constituencyParam || (group?.Constituencies?.[0] ?? "");

  const { data: registrations } = useRegistrations(constituencyId);
  const { data: transportNeeded } = useTransportNeeded();

  if (groupLoading) {
    return <Page title="Voter Registrations" description="Loading..."><PageSkeleton /></Page>;
  }

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

  const showTransportOnly = transportOnly === "true";
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
