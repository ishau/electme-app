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
      maxWidth: "360px",
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
    <>
      <style>{`
        .maplibregl-popup-close-button {
          font-size: 0;
          width: 24px;
          height: 24px;
          top: 6px;
          right: 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
          transition: background 0.15s, color 0.15s;
        }
        .maplibregl-popup-close-button:hover {
          background: #f3f4f6;
          color: #333;
        }
        .maplibregl-popup-close-button::after {
          content: "\\2715";
          font-size: 13px;
          line-height: 1;
        }
        .maplibregl-popup-content {
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
      `}</style>
      <div
        ref={containerRef}
        className={className ?? "h-[600px] w-full rounded-md"}
        style={{ zIndex: 0 }}
      />
    </>
  );
}
