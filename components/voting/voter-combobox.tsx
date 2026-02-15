"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface VoterOption {
  id: string;
  name: string;
  nationalId: string;
}

interface VoterComboboxProps {
  voters: VoterOption[];
  value: string;
  onSelect: (id: string) => void;
  placeholder?: string;
}

export function VoterCombobox({
  voters,
  value,
  onSelect,
  placeholder = "Search voter...",
}: VoterComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = voters.find((v) => v.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="truncate">{selected.name}</span>
          ) : (
            <span className="text-muted-foreground flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Type a name..." />
          <CommandList>
            <CommandEmpty>No voter found.</CommandEmpty>
            <CommandGroup>
              {voters.map((v) => (
                <CommandItem
                  key={v.id}
                  value={`${v.name} ${v.nationalId}`}
                  onSelect={() => {
                    onSelect(v.id === value ? "" : v.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === v.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm">{v.name}</span>
                    <span className="text-xs text-muted-foreground">{v.nationalId}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
