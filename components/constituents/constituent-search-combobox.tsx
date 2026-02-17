"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchConstituents } from "@/lib/hooks/use-constituents";
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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");

  // Debounce the query by 300ms
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data, isFetching } = useSearchConstituents(debouncedQuery);

  const results = useMemo(() => {
    if (!data) return [];
    return excludeId ? data.filter((r) => r.ID !== excludeId) : data;
  }, [data, excludeId]);

  const handleSelect = (result: ConstituentSearchResult) => {
    onSelect(result.ID, result.FullName);
    setSelectedName(result.FullName);
    setQuery("");
    setDebouncedQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onSelect("", "");
    setSelectedName("");
    setQuery("");
    setDebouncedQuery("");
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
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
          {results.map((r) => {
            const idDisplay = r.FullNationalID ?? r.MaskedNationalID;
            const addressParts = [r.PermanentAddress, r.IslandName].filter(Boolean);
            return (
              <button
                key={r.ID}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{r.FullName}</span>
                  {r.Age != null && <span className="text-xs text-muted-foreground shrink-0">{r.Age} yrs</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {idDisplay}
                  {r.Nicknames?.length ? ` · ${r.Nicknames.join(", ")}` : ""}
                  {addressParts.length > 0 && ` · ${addressParts.join(" / ")}`}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {open && debouncedQuery.length >= 2 && !isFetching && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <p className="px-3 py-2 text-sm text-muted-foreground">No results found.</p>
        </div>
      )}
    </div>
  );
}
