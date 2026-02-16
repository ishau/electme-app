"use client";

import { useAtolls } from "@/lib/hooks/use-geography";
import { useConstituencies } from "@/lib/hooks/use-constituencies";
import { GeographyView } from "@/components/settings/geography-view";
import { Page } from "@/components/shared/page";
import { PageSkeleton } from "@/components/shared/loading-skeleton";

export default function GeographyPage() {
  const { data: atolls, isLoading: atollsLoading } = useAtolls();
  const { data: constituencies, isLoading: constituenciesLoading } = useConstituencies();

  if (atollsLoading || constituenciesLoading) {
    return <Page title="Geography" description="Loading..."><PageSkeleton /></Page>;
  }

  return (
    <Page title="Geography" description="Atolls, islands, and constituencies">
      <GeographyView atolls={atolls ?? []} constituencies={constituencies ?? []} />
    </Page>
  );
}
