"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, Vote, User, MapPin } from "lucide-react";

const MAP_TABS = [
  { label: "Party Leaning", href: "/maps/leaning", icon: BarChart3, description: "Voter distribution and dominant party per hex cell" },
  { label: "Party Support", href: "/maps/party-support", icon: Vote, description: "Support levels across hex cells, overall or per party" },
  { label: "Candidate Support", href: "/maps/candidate-support", icon: User, description: "Support levels for a specific candidate across hex cells" },
  { label: "House Locations", href: "/maps/houses", icon: MapPin, description: "Plot and manage house locations" },
];

export default function MapsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = MAP_TABS.find((t) => t.href === pathname) ?? MAP_TABS[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{activeTab.label}</h1>
        <p className="text-muted-foreground mt-1">{activeTab.description}</p>
      </div>
      <nav className="flex gap-1 border-b overflow-x-auto">
        {MAP_TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
