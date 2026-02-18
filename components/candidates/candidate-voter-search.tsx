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
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const supportLevels = [
  { value: "all", label: "All Levels" },
  { value: "strong_supporter", label: "Strong Supporter" },
  { value: "leaning", label: "Leaning" },
  { value: "undecided", label: "Undecided" },
  { value: "soft_opposition", label: "Soft Opposition" },
  { value: "hard_opposition", label: "Hard Opposition" },
];

export function CandidateVoterSearch() {
  const [filters, setFilters] = useQueryStates(
    {
      level: parseAsString.withDefault(""),
      name: parseAsString.withDefault(""),
      page: parseAsString,
    },
    { shallow: false }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: null });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <Select
        value={filters.level || "all"}
        onValueChange={(value) =>
          setFilters({ level: (value ?? "all") === "all" ? null : value, page: null })
        }
        items={Object.fromEntries(supportLevels.map((l) => [l.value, l.label]))}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Support Level" />
        </SelectTrigger>
        <SelectContent>
          {supportLevels.map((l) => (
            <SelectItem key={l.value} value={l.value}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={filters.name}
          onChange={(e) => setFilters({ name: e.target.value || null, page: null })}
          className="pl-9"
        />
      </div>
      <Button type="submit" size="icon" variant="secondary">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
