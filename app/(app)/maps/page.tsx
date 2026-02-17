"use client";

import Link from "next/link";
import { Page } from "@/components/shared/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hexagon, Vote, User } from "lucide-react";

const MAP_PAGES = [
  {
    title: "Dominant Party",
    description: "See which party dominates each hex cell based on voter affiliation.",
    href: "/maps/dominant",
    icon: Hexagon,
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
  return (
    <Page title="Maps" description="Hex analytics and voter distribution maps">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MAP_PAGES.map((page) => {
          const Icon = page.icon;
          return (
            <Link key={page.href} href={page.href}>
              <Card className="transition-colors hover:border-foreground/20">
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
