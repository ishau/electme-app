"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useHouses } from "@/lib/hooks/use-houses";
import { useConstituencies } from "@/lib/hooks/use-constituencies";
import { plotHouse, unplotHouse } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Home, MapPin, Search, X } from "lucide-react";
import type { House } from "@/lib/types";
import "maplibre-gl/dist/maplibre-gl.css";

const PLOTTED_OPTIONS = [
  { value: "all", label: "All" },
  { value: "false", label: "Unplotted" },
  { value: "true", label: "Plotted" },
];

const PAGE_SIZE = 50;

export function HouseManagementView() {
  const queryClient = useQueryClient();
  const { data: constituencies } = useConstituencies();

  const [constituencyId, setConstituencyId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [plotted, setPlotted] = useState("false");
  const [page, setPage] = useState(0);

  // Debounce search — reset page on filter change
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: result, isLoading } = useHouses({
    search: debouncedSearch || undefined,
    plotted: plotted !== "all" ? plotted : undefined,
    constituency_id: constituencyId || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  // Plot dialog
  const [plotTarget, setPlotTarget] = useState<House | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePlot = (lat: number, lng: number) => {
    if (!plotTarget) return;
    startTransition(async () => {
      try {
        await plotHouse(plotTarget.ID, { lat, lng });
        queryClient.invalidateQueries({ queryKey: ["houses"] });
        toast.success(`${plotTarget.HouseName} plotted`);
        setPlotTarget(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to plot house");
      }
    });
  };

  const handleUnplot = (house: House) => {
    startTransition(async () => {
      try {
        await unplotHouse(house.ID);
        queryClient.invalidateQueries({ queryKey: ["houses"] });
        toast.success(`${house.HouseName} unplotted`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to unplot house");
      }
    });
  };

  const houses = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={constituencyId || "all"} onValueChange={(v) => { setConstituencyId(v === "all" ? "" : v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All constituencies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All constituencies</SelectItem>
            {(constituencies ?? []).map((c) => (
              <SelectItem key={c.ID} value={c.ID}>
                {c.Code} — {c.Name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search house name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={plotted} onValueChange={(v) => { setPlotted(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLOTTED_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        {total} house{total !== 1 ? "s" : ""} found
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : total === 0 ? (
        <EmptyState icon={Home} title="No houses found" />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>House</TableHead>
                <TableHead className="hidden sm:table-cell">Island</TableHead>
                <TableHead className="text-center w-20">Residents</TableHead>
                <TableHead className="text-center w-24">Status</TableHead>
                <TableHead className="text-right w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {houses.map((house) => (
                <TableRow key={house.ID}>
                  <TableCell className="font-medium">{house.HouseName}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {house.IslandName}
                  </TableCell>
                  <TableCell className="text-center">{house.ResidentCount}</TableCell>
                  <TableCell className="text-center">
                    {house.Lat != null ? (
                      <Badge variant="default" className="text-xs">Plotted</Badge>
                    ) : house.H3Cell ? (
                      <Badge variant="secondary" className="text-xs">Approximate</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Unplotted</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {house.Lat != null ? (
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPlotTarget(house)}
                        >
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          Move
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnplot(house)}
                          disabled={isPending}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPlotTarget(house)}
                      >
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        Plot
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page + 1 >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Plot dialog with map */}
      {plotTarget && (
        <PlotDialog
          house={plotTarget}
          open={!!plotTarget}
          onOpenChange={(open) => !open && setPlotTarget(null)}
          onConfirm={handlePlot}
          isPending={isPending}
        />
      )}
    </div>
  );
}

// ── Plot Dialog with Map ──

interface PlotDialogProps {
  house: House;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (lat: number, lng: number) => void;
  isPending: boolean;
}

function PlotDialog({ house, open, onOpenChange, onConfirm, isPending }: PlotDialogProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    house.Lat != null && house.Lng != null ? { lat: house.Lat, lng: house.Lng } : null
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {house.Lat != null ? "Move" : "Plot"} — {house.HouseName}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{house.IslandName}</p>
        <PlotMap
          initialLat={house.Lat}
          initialLng={house.Lng}
          islandLat={house.IslandLat}
          islandLng={house.IslandLng}
          h3Cell={house.H3Cell}
          onSelect={setCoords}
        />
        {coords && (
          <p className="text-xs text-muted-foreground text-center">
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => coords && onConfirm(coords.lat, coords.lng)}
            disabled={!coords || isPending}
          >
            {isPending ? "Saving..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Maplibre Plot Map ──

interface PlotMapProps {
  initialLat: number | null;
  initialLng: number | null;
  islandLat?: number | null;
  islandLng?: number | null;
  h3Cell?: string | null;
  onSelect: (coords: { lat: number; lng: number }) => void;
}

function PlotMap({ initialLat, initialLng, islandLat, islandLng, h3Cell, onSelect }: PlotMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [isSatellite, setIsSatellite] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    Promise.all([
      import("maplibre-gl"),
      h3Cell ? import("h3-js") : Promise.resolve(null),
    ]).then(([mlMod, h3Mod]) => {
      if (cancelled) return;
      const ml = mlMod.default;

      // Compute H3 hex boundary if base-plotted
      let hexBoundary: [number, number][] | null = null;
      let hexCenter: [number, number] | null = null;
      if (h3Cell && h3Mod) {
        const coords = h3Mod.cellToBoundary(h3Cell);
        hexBoundary = coords.map(([lat, lng]: [number, number]) => [lng, lat] as [number, number]);
        hexBoundary.push(hexBoundary[0]);
        const [cLat, cLng] = h3Mod.cellToLatLng(h3Cell);
        hexCenter = [cLng, cLat];
      }

      const hasPlotted = initialLng != null && initialLat != null;
      const hasIsland = islandLng != null && islandLat != null;
      const center: [number, number] = hasPlotted
        ? [initialLng, initialLat]
        : hexCenter
          ? hexCenter
          : hasIsland
            ? [islandLng, islandLat]
            : [73.22, 3.2];
      const zoom = hasPlotted ? 16 : hexCenter ? 16 : hasIsland ? 15 : 6;

      const map = new ml.Map({
        container: containerRef.current!,
        style: {
          version: 8 as const,
          sources: {
            satellite: {
              type: "raster" as const,
              tiles: [
                "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
              ],
              tileSize: 256,
              maxzoom: 20,
              attribution: "&copy; Google",
            },
            osm: {
              type: "raster" as const,
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "&copy; OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "satellite",
              type: "raster" as const,
              source: "satellite",
              minzoom: 0,
              maxzoom: 20,
            },
            {
              id: "osm",
              type: "raster" as const,
              source: "osm",
              minzoom: 0,
              maxzoom: 19,
              layout: { visibility: "none" as const },
            },
          ],
        },
        center,
        zoom,
      });

      map.addControl(new ml.NavigationControl(), "top-left");
      mapRef.current = map;

      if (initialLat != null && initialLng != null) {
        markerRef.current = new ml.Marker({ color: "#ef4444" })
          .setLngLat([initialLng, initialLat])
          .addTo(map);
      }

      if (hexBoundary) {
        map.on("load", () => {
          map.addSource("h3-area", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "Polygon", coordinates: [hexBoundary] },
            },
          });
          map.addLayer({
            id: "h3-area-fill",
            type: "fill",
            source: "h3-area",
            paint: { "fill-color": "#ef4444", "fill-opacity": 0.2 },
          });
          map.addLayer({
            id: "h3-area-outline",
            type: "line",
            source: "h3-area",
            paint: { "line-color": "#ef4444", "line-width": 2 },
          });
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on("click", (e: any) => {
        const { lat, lng } = e.lngLat;
        onSelectRef.current({ lat, lng });

        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          markerRef.current = new ml.Marker({ color: "#ef4444" })
            .setLngLat([lng, lat])
            .addTo(map);
        }
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleBaseLayer = () => {
    const map = mapRef.current;
    if (!map) return;
    if (isSatellite) {
      map.setLayoutProperty("satellite", "visibility", "none");
      map.setLayoutProperty("osm", "visibility", "visible");
    } else {
      map.setLayoutProperty("osm", "visibility", "none");
      map.setLayoutProperty("satellite", "visibility", "visible");
    }
    setIsSatellite(!isSatellite);
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[400px] w-full rounded-md border"
        style={{ zIndex: 0 }}
      />
      <button
        type="button"
        onClick={toggleBaseLayer}
        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-xs font-medium px-2 py-1.5 rounded shadow border border-gray-200"
      >
        {isSatellite ? "Street" : "Satellite"}
      </button>
    </div>
  );
}
