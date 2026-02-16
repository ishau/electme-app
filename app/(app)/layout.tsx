import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AppLayoutContent } from "@/components/layout/app-layout-content";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <Suspense>
        <AppLayoutContent>{children}</AppLayoutContent>
      </Suspense>
    </NuqsAdapter>
  );
}
