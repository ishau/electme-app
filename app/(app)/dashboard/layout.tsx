"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, Activity, Users, Phone, Flag } from "lucide-react";

const DASHBOARD_TABS = [
  { label: "Overview", href: "/dashboard/overview", icon: Activity, description: "Key metrics, follow-ups, and quick actions" },
  { label: "Demographics", href: "/dashboard/demographics", icon: Users, description: "Voter demographics by age, sex, island, and constituency" },
  { label: "Campaign", href: "/dashboard/campaign", icon: BarChart3, description: "Support trends, candidate performance, and constituency comparison" },
  { label: "Outreach", href: "/dashboard/outreach", icon: Phone, description: "Contact activity, team performance, and outreach methods" },
  { label: "Election Day", href: "/dashboard/election-day", icon: Flag, description: "Transport logistics, turnout tracking, and registration progress" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = DASHBOARD_TABS.find((t) => t.href === pathname) ?? DASHBOARD_TABS[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">{activeTab.description}</p>
      </div>
      <nav className="flex gap-1 border-b overflow-x-auto">
        {DASHBOARD_TABS.map((tab) => {
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
