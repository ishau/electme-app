"use client";

import { useEffect, useCallback } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { AddressLocation } from "@/lib/types";

// Fix Leaflet default marker icon paths (webpack breaks the default asset resolution)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER: [number, number] = [4.1755, 73.5093]; // Male', Maldives
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

  // Update cursor style
  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = editMode ? "crosshair" : "";
    return () => {
      container.style.cursor = "";
    };
  }, [map, editMode]);

  return null;
}

function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    let heat: any;
    import("leaflet.heat").then(() => {
      heat = (L as any).heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
      });
      heat.addTo(map);
    });

    return () => {
      if (heat) {
        map.removeLayer(heat);
      }
    };
  }, [map, points]);

  return null;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [map, center]);
  return null;
}

interface AddressMapInnerProps {
  locations: AddressLocation[];
  editMode?: boolean;
  onLocationSet?: (lat: number, lng: number) => void;
  heatMapPoints?: [number, number, number][];
  className?: string;
}

export function AddressMapInner({
  locations,
  editMode = false,
  onLocationSet,
  heatMapPoints,
  className,
}: AddressMapInnerProps) {
  const center: [number, number] =
    locations.length > 0
      ? [locations[0].Latitude, locations[0].Longitude]
      : heatMapPoints && heatMapPoints.length > 0
        ? [heatMapPoints[0][0], heatMapPoints[0][1]]
        : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      className={className ?? "h-[400px] w-full rounded-md"}
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      {locations.map((loc) => (
        <Marker key={loc.ID} position={[loc.Latitude, loc.Longitude]}>
          <Popup>{loc.AddressName}</Popup>
        </Marker>
      ))}
      {onLocationSet && (
        <MapClickHandler editMode={editMode} onLocationSet={onLocationSet} />
      )}
      {heatMapPoints && heatMapPoints.length > 0 && <HeatLayer points={heatMapPoints} />}
    </MapContainer>
  );
}
