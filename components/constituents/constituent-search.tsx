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

export function ConstituentSearch() {
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      sex: parseAsString.withDefault(""),
      page: parseAsString,
    },
    { shallow: false }
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, address..."
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value || null, page: null })}
          className="pl-9"
        />
      </div>
      <Select
        value={filters.sex || "all"}
        onValueChange={(value) =>
          setFilters({ sex: value === "all" ? null : value, page: null })
        }
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Gender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Genders</SelectItem>
          <SelectItem value="M">Male</SelectItem>
          <SelectItem value="F">Female</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
