"use client";

import { useEffect, useCallback } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { House } from "@/lib/types";

const DEFAULT_CENTER: [number, number] = [4.1755, 73.5093];
const DEFAULT_ZOOM = 14;

function MapClickHandler({
  editMode,
  onLocationSet,
}: {
  editMode: boolean;
  onLocationSet: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  const handleClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (editMode) {
        onLocationSet(e.latlng.lat, e.latlng.lng);
      }
    },
    [editMode, onLocationSet]
  );

  useEffect(() => {
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, handleClick]);

  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = editMode ? "crosshair" : "";
    return () => {
      container.style.cursor = "";
    };
  }, [map, editMode]);

  return null;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [map, center]);
  return null;
}

interface HouseMapInnerProps {
  houses: House[];
  selectedHouseId: string | null;
  editMode: boolean;
  onLocationSet: (lat: number, lng: number) => void;
  onHouseClick?: (houseId: string) => void;
  className?: string;
}

export function HouseMapInner({
  houses,
  selectedHouseId,
  editMode,
  onLocationSet,
  onHouseClick,
  className,
}: HouseMapInnerProps) {
  const located = houses.filter((h) => h.Lat !== null && h.Lng !== null);
  const center: [number, number] =
    located.length > 0
      ? [located[0].Lat!, located[0].Lng!]
      : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      className={className ?? "h-[500px] w-full rounded-md"}
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      {located.map((house) => {
        const isSelected = house.ID === selectedHouseId;
        return (
          <CircleMarker
            key={house.ID}
            center={[house.Lat!, house.Lng!]}
            radius={isSelected ? 8 : 5}
            pathOptions={{
              color: isSelected ? "#2563eb" : house.HasOverride ? "#f59e0b" : "#6b7280",
              fillColor: isSelected ? "#3b82f6" : house.HasOverride ? "#fbbf24" : "#9ca3af",
              fillOpacity: 0.8,
              weight: isSelected ? 3 : 1.5,
            }}
            eventHandlers={{
              click: () => onHouseClick?.(house.ID),
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{house.HouseName}</div>
                <div className="text-muted-foreground">{house.ResidentCount} residents</div>
                {house.HasOverride && (
                  <div className="text-amber-600 text-xs mt-1">Custom position</div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
      <MapClickHandler editMode={editMode} onLocationSet={onLocationSet} />
    </MapContainer>
  );
}
