import { get } from "@/lib/api";
import type { Party } from "@/lib/types";
import { PartiesView } from "@/components/settings/parties-view";
import { Page } from "@/components/shared/page";

export default async function PartiesPage() {
  const parties = await get<Party[]>("/parties");

  return (
    <Page title="Parties" description="Manage political parties">
      <PartiesView parties={parties ?? []} />
    </Page>
  );
}
