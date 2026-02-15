"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import { Badge } from "@/components/ui/badge";

interface AppShellProps {
  groupName: string;
  partyCode?: string;
  children: React.ReactNode;
}

export function AppShell({ groupName, partyCode, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar groupName={groupName} partyCode={partyCode} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-4 md:px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold truncate">{groupName}</span>
            {partyCode && (
              <Badge variant="secondary" className="text-[10px]">{partyCode}</Badge>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
