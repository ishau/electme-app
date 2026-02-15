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
import { Search, MapPin } from "lucide-react";

interface ConstituentSearchProps {
  currentName: string;
  currentConstituencyId: string;
  currentSex: string;
  currentAddress: string;
}

export function ConstituentSearch({
  currentName,
  currentConstituencyId,
  currentSex,
  currentAddress,
}: ConstituentSearchProps) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [address, setAddress] = useState(currentAddress);

  const navigate = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams();
      const merged = {
        name,
        address,
        constituency_id: currentConstituencyId,
        sex: currentSex,
        ...overrides,
      };
      Object.entries(merged).forEach(([key, value]) => {
        if (value && value !== "all") params.set(key, value);
      });
      params.delete("page");
      const qs = params.toString();
      router.push(`/constituents${qs ? `?${qs}` : ""}`);
    },
    [router, name, address, currentConstituencyId, currentSex]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ name, address });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by address..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={currentSex || "all"}
        onValueChange={(value) => navigate({ sex: value })}
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
      <Button type="submit" size="icon" variant="secondary">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
