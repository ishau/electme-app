import { get } from "@/lib/api";
import type { Atoll, Constituency } from "@/lib/types";
import { GeographyView } from "@/components/settings/geography-view";
import { Page } from "@/components/shared/page";

export default async function GeographyPage() {
  const [atolls, constituencies] = await Promise.all([
    get<Atoll[]>("/atolls"),
    get<Constituency[]>("/constituencies"),
  ]);

  return (
    <Page title="Geography" description="Atolls, islands, and constituencies">
      <GeographyView atolls={atolls ?? []} constituencies={constituencies ?? []} />
    </Page>
  );
}
