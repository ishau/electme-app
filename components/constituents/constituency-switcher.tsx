"use client";

import { useQueryState, parseAsString } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const handleSwitch = (value: string | null) => {
    const v = value ?? "";
    setConstituencyId(v === "all" ? null : v);
    setPage(null);
  };

  return (
    <Select
      value={currentConstituencyId || "all"}
      onValueChange={handleSwitch}
      items={{
        all: "All constituencies",
        ...Object.fromEntries(constituencies.map((c) => [c.ID, `${c.Code} — ${c.Name}`])),
      }}
    >
      <SelectTrigger className="w-full sm:w-[280px]">
        <SelectValue placeholder="All constituencies" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All constituencies</SelectItem>
        {constituencies.map((c) => (
          <SelectItem key={c.ID} value={c.ID}>
            {c.Code} — {c.Name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
