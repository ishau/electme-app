"use client";

import { HouseManagementView } from "@/components/settings/geography-view";
import { Page } from "@/components/shared/page";

export default function HousesPage() {
  return (
    <Page title="Houses" description="Plot house locations">
      <HouseManagementView />
    </Page>
  );
}
