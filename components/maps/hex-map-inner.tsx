"use client";

import { useRef, useEffect, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MALDIVES_CENTER: [number, number] = [73.22, 3.2];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoJSON = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StyleExpression = any;

interface HexMapInnerProps {
  geojson: GeoJSON | null;
  fillColorExpr: StyleExpression;
  buildPopupHtml: (properties: Record<string, unknown>) => string;
  className?: string;
}

export function HexMapInner({
  geojson,
  fillColorExpr,
  buildPopupHtml,
  className,
}: HexMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const buildPopupHtmlRef = useRef(buildPopupHtml);
  buildPopupHtmlRef.current = buildPopupHtml;

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: MALDIVES_CENTER,
      zoom: 6,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-left");
    mapRef.current = map;
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
    });

    return () => map.remove();
  }, []);

  // Memoized click handler that uses ref
  const handleClick = useCallback((e: maplibregl.MapMouseEvent & { features?: maplibregl.GeoJSONFeature[] }) => {
    if (!e.features?.length || !popupRef.current || !mapRef.current) return;
    const props = e.features[0].properties ?? {};
    const html = buildPopupHtmlRef.current(props);
    popupRef.current.setLngLat(e.lngLat).setHTML(html).addTo(mapRef.current);
  }, []);

  // Update GeoJSON + layer styling
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;

    const apply = () => {
      if (map.getSource("hexagons")) {
        (map.getSource("hexagons") as maplibregl.GeoJSONSource).setData(geojson);
        // Update fill color expression
        map.setPaintProperty("hex-fill", "fill-color", fillColorExpr);
      } else {
        map.addSource("hexagons", { type: "geojson", data: geojson });

        map.addLayer({
          id: "hex-fill",
          type: "fill",
          source: "hexagons",
          paint: {
            "fill-color": fillColorExpr,
            "fill-opacity": 0.6,
          },
        });

        map.addLayer({
          id: "hex-outline",
          type: "line",
          source: "hexagons",
          paint: {
            "line-color": "#fff",
            "line-width": 1.5,
            "line-opacity": 0.8,
          },
        });

        map.on("click", "hex-fill", handleClick);

        map.on("mouseenter", "hex-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "hex-fill", () => {
          map.getCanvas().style.cursor = "";
        });
      }

      // Fit bounds
      if (geojson.features?.length) {
        const bounds = new maplibregl.LngLatBounds();
        for (const f of geojson.features) {
          const coords = f.geometry.coordinates[0];
          for (const c of coords) {
            bounds.extend(c as [number, number]);
          }
        }
        map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once("load", apply);
    }
  }, [geojson, fillColorExpr, handleClick]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-[600px] w-full rounded-md"}
      style={{ zIndex: 0 }}
    />
  );
}
