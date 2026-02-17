"use client";

import dynamic from "next/dynamic";

const HexMapInner = dynamic(
  () => import("./hex-map-inner").then((mod) => mod.HexMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-muted animate-pulse rounded-md" />
    ),
  }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoJSON = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StyleExpression = any;

interface HexMapProps {
  geojson: GeoJSON | null;
  fillColorExpr: StyleExpression;
  buildPopupHtml: (properties: Record<string, unknown>) => string;
  className?: string;
}

export function HexMap(props: HexMapProps) {
  return <HexMapInner {...props} />;
}
