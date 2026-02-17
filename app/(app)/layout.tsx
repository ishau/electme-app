import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AppLayoutContent } from "@/components/layout/app-layout-content";
import { AuthGuard } from "@/components/auth-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <Suspense>
        <AuthGuard>
          <AppLayoutContent>{children}</AppLayoutContent>
        </AuthGuard>
      </Suspense>
    </NuqsAdapter>
  );
}
