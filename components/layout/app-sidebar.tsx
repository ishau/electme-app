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
  MapPin,
  Bus,
  LogOut,
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import { useAuth } from "@/lib/hooks/use-auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Voters", href: "/constituents", icon: Users },
  { label: "Candidates", href: "/candidates", icon: UserCog },
  { label: "Team", href: "/team", icon: UserCog },
  { label: "Campaign", href: "/campaign", icon: Megaphone },
  { label: "Registrations", href: "/registrations", icon: ClipboardList },
  { label: "Transport", href: "/transport", icon: Bus },
  { label: "Maps", href: "/maps", icon: MapPin },
  { label: "Voting Day", href: "/voting", icon: Vote },
];


export function AppSidebar({ groupName, partyCode }: { groupName: string; partyCode?: string }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Vote className="h-6 w-6 text-primary" />
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
                const isActive = pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground truncate">
            {user?.username}
          </p>
          <Button variant="ghost" size="sm" onClick={logout} className="h-7 px-2">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
