"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Constituency } from "@/lib/types";

interface ConstituencySwitcherProps {
  constituencies: Constituency[];
  currentConstituencyId: string;
}

export function ConstituencySwitcher({
  constituencies,
  currentConstituencyId,
}: ConstituencySwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSwitch = (constituencyId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("constituency_id", constituencyId);
    // Reset to page 1 when switching
    params.delete("page");
    router.push(`/constituents?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {constituencies.map((c) => (
        <Button
          key={c.ID}
          variant={c.ID === currentConstituencyId ? "default" : "outline"}
          size="sm"
          onClick={() => handleSwitch(c.ID)}
        >
          {c.Code} — {c.Name}
        </Button>
      ))}
    </div>
  );
}
