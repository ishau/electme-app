"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Atoll, Island } from "@/lib/types";

interface IslandSelectorProps {
  atolls: Atoll[];
  islandsByAtoll: Record<string, Island[]>;
  value: string;
  onChange: (islandId: string) => void;
  className?: string;
}

export function IslandSelector({ atolls, islandsByAtoll, value, onChange, className }: IslandSelectorProps) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Island</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[280px] mt-1.5">
          <SelectValue placeholder="Select island" />
        </SelectTrigger>
        <SelectContent>
          {atolls.map((atoll) => {
            const atollIslands = islandsByAtoll[atoll.ID] ?? [];
            if (!atollIslands.length) return null;
            return (
              <SelectGroup key={atoll.ID}>
                <SelectLabel>{atoll.Code}. {atoll.Name}</SelectLabel>
                {atollIslands.map((i) => (
                  <SelectItem key={i.ID} value={i.ID}>
                    {i.Name}
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
