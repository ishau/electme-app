"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AddressMap } from "@/components/shared/address-map";
import { MapPin, Trash2, Check } from "lucide-react";
import { saveAddressLocation, deleteAddressLocation } from "@/lib/mutations";
import { get } from "@/lib/api";
import { toast } from "sonner";
import type { Atoll, Island, AddressLocation, AddressWithCount } from "@/lib/types";

interface AddressLocationEditorProps {
  atolls: Atoll[];
}

export function AddressLocationEditor({ atolls }: AddressLocationEditorProps) {
  const [isPending, startTransition] = useTransition();

  const [selectedAtoll, setSelectedAtoll] = useState("");
  const [islands, setIslands] = useState<Island[]>([]);
  const [selectedIsland, setSelectedIsland] = useState("");
  const [locations, setLocations] = useState<AddressLocation[]>([]);
  const [addresses, setAddresses] = useState<AddressWithCount[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const handleSelectAtoll = async (atollId: string) => {
    setSelectedAtoll(atollId);
    setSelectedIsland("");
    setLocations([]);
    setAddresses([]);
    setSelectedAddress(null);
    try {
      setIslands((await get<Island[]>(`/atolls/${atollId}/islands`)) ?? []);
    } catch {
      setIslands([]);
    }
  };

  const loadIslandData = async (islandId: string) => {
    try {
      const [locs, addrs] = await Promise.all([
        get<AddressLocation[]>(`/islands/${islandId}/address-locations`).then((r) => r ?? []),
        get<AddressWithCount[]>(`/islands/${islandId}/unique-addresses`).then((r) => r ?? []),
      ]);
      setLocations(locs);
      setAddresses(addrs);
    } catch {
      setLocations([]);
      setAddresses([]);
    }
  };

  const handleSelectIsland = async (islandId: string) => {
    setSelectedIsland(islandId);
    setSelectedAddress(null);
    await loadIslandData(islandId);
  };

  const handleLocationSet = (lat: number, lng: number) => {
    if (!selectedAddress || !selectedIsland) {
      toast.error("Select an address from the list first");
      return;
    }
    startTransition(async () => {
      try {
        await saveAddressLocation({
          island_id: selectedIsland,
          address_name: selectedAddress,
          latitude: lat,
          longitude: lng,
        });
        toast.success(`Pin set for "${selectedAddress}"`);
        setSelectedAddress(null);
        await loadIslandData(selectedIsland);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  const handleDelete = (addressName: string) => {
    const loc = locations.find((l) => l.AddressName === addressName);
    if (!loc) return;
    startTransition(async () => {
      try {
        await deleteAddressLocation(loc.ID);
        toast.success(`Pin removed for "${addressName}"`);
        await loadIslandData(selectedIsland);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  const pinnedNames = new Set(locations.map((l) => l.AddressName));
  const pinnedCount = addresses.filter((a) => pinnedNames.has(a.AddressName)).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Atoll</label>
              <Select value={selectedAtoll} onValueChange={handleSelectAtoll}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select atoll" />
                </SelectTrigger>
                <SelectContent>
                  {atolls.map((a) => (
                    <SelectItem key={a.ID} value={a.ID}>
                      {a.Code}. {a.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Island</label>
              <Select
                value={selectedIsland}
                onValueChange={handleSelectIsland}
                disabled={!selectedAtoll}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select island" />
                </SelectTrigger>
                <SelectContent>
                  {islands.map((i) => (
                    <SelectItem key={i.ID} value={i.ID}>
                      {i.Code} - {i.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedIsland && (
              <div className="flex items-center gap-3 ml-auto text-sm text-muted-foreground">
                <span>{addresses.length} addresses</span>
                <span className="text-border">|</span>
                <span>{pinnedCount} pinned</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedIsland && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Addresses</CardTitle>
              {selectedAddress && (
                <Badge variant="secondary" className="text-xs">
                  Placing: {selectedAddress}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <EmptyState icon={MapPin} title="No addresses found" description="Import voters for this island first." />
              ) : (
                <>
                  <div className="rounded-md border max-h-[350px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Address</TableHead>
                          <TableHead className="text-right w-16">Count</TableHead>
                          <TableHead className="w-20">Pin</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {addresses.map((addr) => {
                          const isPinned = pinnedNames.has(addr.AddressName);
                          return (
                            <TableRow
                              key={addr.AddressName}
                              className={`cursor-pointer transition-colors ${
                                selectedAddress === addr.AddressName
                                  ? "bg-accent/10 border-l-2 border-l-accent"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() => setSelectedAddress(addr.AddressName)}
                            >
                              <TableCell className="text-sm">{addr.AddressName}</TableCell>
                              <TableCell className="text-right text-sm tabular-nums">{addr.Count}</TableCell>
                              <TableCell>
                                {isPinned ? (
                                  <Badge variant="outline" className="gap-1 text-accent border-accent/30">
                                    <Check className="h-3 w-3" />
                                    Pinned
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">--</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {isPinned && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    disabled={isPending}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(addr.AddressName);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {selectedAddress && (
                    <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-accent" />
                      Click on the map to place pin for <strong>{selectedAddress}</strong>
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Map</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressMap
                locations={locations}
                editMode={!!selectedAddress}
                onLocationSet={handleLocationSet}
                className="h-[350px] w-full rounded-md"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
