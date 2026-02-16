"use client";

import { useQueryState, parseAsString } from "nuqs";
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
  const [, setConstituencyId] = useQueryState("constituency_id", parseAsString.withDefault(""));
  const [, setPage] = useQueryState("page");

  const handleSwitch = (id: string) => {
    setConstituencyId(id || null);
    setPage(null);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={currentConstituencyId === "" ? "default" : "outline"}
        size="sm"
        onClick={() => handleSwitch("")}
      >
        All
      </Button>
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
