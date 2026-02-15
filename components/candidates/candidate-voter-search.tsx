"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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

interface CandidateVoterSearchProps {
  candidateId: string;
  currentLevel: string;
  currentName: string;
}

const supportLevels = [
  { value: "all", label: "All Levels" },
  { value: "strong_supporter", label: "Strong Supporter" },
  { value: "leaning", label: "Leaning" },
  { value: "undecided", label: "Undecided" },
  { value: "soft_opposition", label: "Soft Opposition" },
  { value: "hard_opposition", label: "Hard Opposition" },
];

export function CandidateVoterSearch({
  candidateId,
  currentLevel,
  currentName,
}: CandidateVoterSearchProps) {
  const router = useRouter();
  const [name, setName] = useState(currentName);

  const navigate = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams();
      const merged = {
        name,
        level: currentLevel,
        ...overrides,
      };
      Object.entries(merged).forEach(([key, value]) => {
        if (value && value !== "all") params.set(key, value);
      });
      params.delete("page");
      const qs = params.toString();
      router.push(`/candidates/${candidateId}${qs ? `?${qs}` : ""}`);
    },
    [router, name, currentLevel, candidateId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ name });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <Select
        value={currentLevel || "all"}
        onValueChange={(value) => navigate({ level: value })}
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="pl-9"
        />
      </div>
      <Button type="submit" size="icon" variant="secondary">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
