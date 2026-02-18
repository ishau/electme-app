"use client";

import { useQueryStates, parseAsString } from "nuqs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { Constituency } from "@/lib/types";

interface ConstituentSearchProps {
  constituencies: Constituency[];
}

export function ConstituentSearch({ constituencies }: ConstituentSearchProps) {
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      constituency_id: parseAsString.withDefault(""),
      page: parseAsString,
    },
    { shallow: false }
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select
        value={filters.constituency_id || "all"}
        onValueChange={(value) => {
          const v = value ?? "";
          setFilters({ constituency_id: v === "all" ? null : v, page: null });
        }}
        items={{
          all: "All constituencies",
          ...Object.fromEntries(constituencies.map((c) => [c.ID, `${c.Code} — ${c.Name}`])),
        }}
      >
        <SelectTrigger className="w-full sm:w-[240px]">
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
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, address..."
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value || null, page: null })}
          className="pl-9"
        />
      </div>
    </div>
  );
}
