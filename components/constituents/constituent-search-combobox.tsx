"use client";

import { useState, useEffect, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { get, getGroupId } from "@/lib/api";
import type { ConstituentSearchResult } from "@/lib/types";

interface ConstituentSearchComboboxProps {
  value: string;
  onSelect: (id: string, name: string) => void;
  excludeId?: string;
  placeholder?: string;
}

export function ConstituentSearchCombobox({
  value,
  onSelect,
  excludeId,
  placeholder = "Search by name, address, phone...",
}: ConstituentSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConstituentSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedName, setSelectedName] = useState("");

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      startTransition(async () => {
        const groupId = getGroupId();
        const data = (await get<ConstituentSearchResult[]>(`/groups/${groupId}/constituents/search`, { q: query })) ?? [];
        setResults(excludeId ? data.filter((r) => r.ID !== excludeId) : data);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, excludeId]);

  const handleSelect = (result: ConstituentSearchResult) => {
    onSelect(result.ID, result.FullName);
    setSelectedName(result.FullName);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    onSelect("", "");
    setSelectedName("");
    setQuery("");
  };

  return (
    <div className="relative">
      {value ? (
        <div className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm">
          <span className="flex-1 truncate">{selectedName}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => query.length >= 2 && setOpen(true)}
            placeholder={placeholder}
            className="pl-9"
          />
          {isPending && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.ID}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <div className="font-medium">{r.FullName}</div>
              <div className="text-xs text-muted-foreground">
                {r.MaskedNationalID}
                {r.PrimaryNickname && ` · ${r.PrimaryNickname}`}
                {r.PermanentAddress?.Name && ` · ${r.PermanentAddress.Name}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 2 && !isPending && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <p className="px-3 py-2 text-sm text-muted-foreground">No results found.</p>
        </div>
      )}
    </div>
  );
}
