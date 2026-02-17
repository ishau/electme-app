"use client";

import Link from "next/link";
import { useQueryState, parseAsString } from "nuqs";
import { useMapIslands } from "@/lib/hooks/use-map-islands";
import { IslandSelector } from "@/components/maps/island-selector";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Hexagon, BarChart3, Vote, User } from "lucide-react";

const MAP_PAGES = [
  {
    title: "Dominant Party",
    description: "See which party dominates each hex cell based on voter affiliation.",
    href: "/maps/dominant",
    icon: Hexagon,
  },
  {
    title: "Party Leaning",
    description: "Multi-party breakdown per hex showing voter distribution across all parties.",
    href: "/maps/leaning",
    icon: BarChart3,
  },
  {
    title: "Party Support",
    description: "Support level breakdown (strong, leaning, undecided, opposition) aggregated per party.",
    href: "/maps/party-support",
    icon: Vote,
  },
  {
    title: "Candidate Support",
    description: "Support levels for a specific candidate across hex cells.",
    href: "/maps/candidate-support",
    icon: User,
  },
];

export default function MapsPage() {
  const { atolls, islandsByAtoll, isLoading } = useMapIslands();
  const [island, setIsland] = useQueryState("island", parseAsString.withDefault(""));

  if (isLoading) {
    return <Page title="Maps" description="Loading..."><PageSkeleton /></Page>;
  }

  if (atolls.length === 0) {
    return (
      <Page title="Maps" description="Hex analytics and voter distribution maps">
        <EmptyState
          icon={MapPin}
          title="No islands assigned"
          description="This group has no constituencies with islands assigned."
        />
      </Page>
    );
  }

  return (
    <Page title="Maps" description="Hex analytics and voter distribution maps">
      <IslandSelector
        atolls={atolls}
        islandsByAtoll={islandsByAtoll}
        value={island}
        onChange={setIsland}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {MAP_PAGES.map((page) => {
          const Icon = page.icon;
          const href = island ? `${page.href}?island=${island}` : page.href;
          return (
            <Link key={page.href} href={href}>
              <Card className={`transition-colors hover:border-foreground/20 ${!island ? "opacity-50 pointer-events-none" : ""}`}>
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{page.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{page.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </Page>
  );
}
