"use client";

import dynamic from "next/dynamic";
import type { AddressLocation } from "@/lib/types";

const AddressMapInner = dynamic(
  () => import("./address-map-inner").then((mod) => mod.AddressMapInner),
  { ssr: false, loading: () => <div className="h-[400px] bg-muted animate-pulse rounded-md" /> }
);

interface AddressMapProps {
  locations: AddressLocation[];
  editMode?: boolean;
  onLocationSet?: (lat: number, lng: number) => void;
  heatMapPoints?: [number, number, number][];
  className?: string;
}

export function AddressMap(props: AddressMapProps) {
  return <AddressMapInner {...props} />;
}
