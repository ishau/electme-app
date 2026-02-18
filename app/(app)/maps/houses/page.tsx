"use client";

import { useState, useMemo, useTransition, useDeferredValue } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { HouseMap } from "@/components/maps/house-map";
import { MapPin, RotateCcw, Save, Search, MapPinOff } from "lucide-react";
import { useHouses } from "@/lib/hooks/use-houses";
import { plotHouse, unplotHouse } from "@/lib/mutations";
import { toast } from "sonner";
import type { House } from "@/lib/types";

export default function HouseLocationsPage() {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [noCoordsOnly, setNoCoordsOnly] = useState(false);
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");

  const { data: housesData, isLoading } = useHouses({ search: deferredSearch || undefined });
  const allHouses = housesData?.data ?? [];

  const houses = useMemo(
    () => (noCoordsOnly ? allHouses.filter((h) => h.Lat === null) : allHouses),
    [allHouses, noCoordsOnly]
  );

  const selectedHouse = houses.find((h) => h.ID === selectedHouseId) ?? null;

  const handleSelectHouse = (house: House) => {
    setSelectedHouseId(house.ID);
    setEditLat(house.Lat !== null ? String(house.Lat) : "");
    setEditLng(house.Lng !== null ? String(house.Lng) : "");
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!selectedHouseId) {
      toast.error("Select a house from the list first");
      return;
    }
    setEditLat(String(Math.round(lat * 1000000) / 1000000));
    setEditLng(String(Math.round(lng * 1000000) / 1000000));
  };

  const handleSave = () => {
    if (!selectedHouseId) return;
    const lat = parseFloat(editLat);
    const lng = parseFloat(editLng);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Invalid coordinates");
      return;
    }
    startTransition(async () => {
      try {
        await plotHouse(selectedHouseId, { lat, lng });
        toast.success(`Location updated for "${selectedHouse?.HouseName}"`);
        queryClient.invalidateQueries({ queryKey: ["houses"] });
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  const handleReset = () => {
    if (!selectedHouseId) return;
    startTransition(async () => {
      try {
        await unplotHouse(selectedHouseId);
        toast.success(`Reset to default for "${selectedHouse?.HouseName}"`);
        setEditLat("");
        setEditLng("");
        queryClient.invalidateQueries({ queryKey: ["houses"] });
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  const handleMapHouseClick = (houseId: string) => {
    const house = houses.find((h) => h.ID === houseId);
    if (house) handleSelectHouse(house);
  };

  if (isLoading && allHouses.length === 0) return <PageSkeleton />;

  const locatedCount = allHouses.filter((h) => h.Lat !== null).length;
  const noCoordsCount = allHouses.length - locatedCount;
  const overrideCount = allHouses.filter((h) => h.IsPlotted).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{allHouses.length} houses</span>
        <span className="text-border">|</span>
        <span>{locatedCount} located</span>
        <span className="text-border">|</span>
        <span>{noCoordsCount} no coords</span>
        <span className="text-border">|</span>
        <span>{overrideCount} overridden</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Houses</CardTitle>
              {selectedHouseId && (
                <Badge variant="secondary" className="text-xs">
                  Editing: {selectedHouse?.HouseName}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search houses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant={noCoordsOnly ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5 shrink-0 h-9"
                  onClick={() => setNoCoordsOnly(!noCoordsOnly)}
                >
                  <MapPinOff className="h-3.5 w-3.5" />
                  No coords
                  {noCoordsCount > 0 && (
                    <Badge variant={noCoordsOnly ? "secondary" : "outline"} className="ml-1 text-xs px-1.5 py-0">
                      {noCoordsCount}
                    </Badge>
                  )}
                </Button>
              </div>
              {houses.length === 0 ? (
                <EmptyState
                  icon={MapPin}
                  title={search || noCoordsOnly ? "No matches" : "No houses found"}
                  description={
                    noCoordsOnly
                      ? "All houses have coordinates."
                      : search
                        ? "Try a different search term."
                        : "No houses registered for your group."
                  }
                />
              ) : (
                <div className="rounded-md border max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>House</TableHead>
                        <TableHead>Island</TableHead>
                        <TableHead className="text-right w-20">Residents</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {houses.map((house) => (
                        <TableRow
                          key={house.ID}
                          className={`cursor-pointer transition-colors ${
                            selectedHouseId === house.ID
                              ? "bg-accent/10 border-l-2 border-l-accent"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => handleSelectHouse(house)}
                        >
                          <TableCell className="text-sm">{house.HouseName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{house.IslandName}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{house.ResidentCount}</TableCell>
                          <TableCell>
                            {house.IsPlotted ? (
                              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                                Custom
                              </Badge>
                            ) : house.Lat !== null ? (
                              <Badge variant="outline" className="gap-1 text-muted-foreground">
                                Base
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">No coords</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedHouse && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Edit Location — {selectedHouse.HouseName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Latitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={editLat}
                      onChange={(e) => setEditLat(e.target.value)}
                      placeholder="e.g. 4.1755"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Longitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={editLng}
                      onChange={(e) => setEditLng(e.target.value)}
                      placeholder="e.g. 73.5093"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Click on the map to set coordinates
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isPending || !editLat || !editLng}
                    className="gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </Button>
                  {selectedHouse.IsPlotted && (
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={isPending}
                      className="gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset to Default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Map</CardTitle>
          </CardHeader>
          <CardContent>
            <HouseMap
              houses={houses}
              selectedHouseId={selectedHouseId}
              editMode={!!selectedHouseId}
              onLocationSet={handleMapClick}
              onHouseClick={handleMapHouseClick}
              className="h-[500px] w-full rounded-md"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
