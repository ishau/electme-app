import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Building2, Globe } from "lucide-react";
import { Page } from "@/components/shared/page";

const settingsItems = [
  {
    title: "Parties",
    description: "Manage political parties",
    href: "/settings/parties",
    icon: Building2,
  },
  {
    title: "Geography",
    description: "Atolls, islands, and constituencies",
    href: "/settings/geography",
    icon: Globe,
  },
];

export default function SettingsPage() {
  return (
    <Page title="Settings">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </Page>
  );
}
