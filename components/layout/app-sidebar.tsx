"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Megaphone,
  ClipboardList,
  Vote,
  Settings,
  FolderOpen,
  ChevronRight,
  MapPin,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, exact: true },
  { label: "Voters", href: "/constituents", icon: Users },
  { label: "Candidates", href: "/candidates", icon: UserCog },
  { label: "Team", href: "/team", icon: UserCog },
  { label: "Campaign", href: "/campaign", icon: Megaphone },
  { label: "Registrations", href: "/registrations", icon: ClipboardList },
  { label: "Maps", href: "/maps", icon: MapPin },
  { label: "Voting Day", href: "/voting", icon: Vote },
];

const settingsNavItems = [
  { label: "Geography", href: "/settings/geography", icon: FolderOpen },
];

export function AppSidebar({ groupName, partyCode }: { groupName: string; partyCode?: string }) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Vote className="h-6 w-6 text-accent" />
          ElectMe
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {groupName}{partyCode ? ` (${partyCode})` : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-1">
              <Settings className="h-3 w-3" />
              Settings
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground">ElectMe v0.1</p>
      </SidebarFooter>
    </Sidebar>
  );
}
